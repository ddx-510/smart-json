interface SendChatRequestParams {
    jsonContent: string;
    chatMessage: string;
    conversationId: string;
    setStreamingMessage: (message: string) => void;
    setConversationId: (id: string) => void;
  }
  
  interface ChatResponse {
    message: string;
    messageId: string;
  }
  
  export async function sendChatRequest({
    jsonContent,
    chatMessage,
    conversationId,
    setStreamingMessage,
    setConversationId
  }: SendChatRequestParams): Promise<ChatResponse> {
    const apiKey = process.env.NEXT_PUBLIC_DIFY_API_KEY;
    
    // Format inputs to include the JSON content
    const inputs = {
      json_content: jsonContent
    };
    
    // Call the Dify API for chat functionality with streaming
    const response = await fetch('https://api.dify.ai/v1/chat-messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        inputs: inputs,
        query: chatMessage,
        response_mode: "streaming",
        conversation_id: conversationId || undefined,
        user: "json-formatter-user",
      }),
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    // Handle streaming response
    const reader = response.body?.getReader();
    if (!reader) throw new Error("Response body is null");
    
    let messageId = "";
    let newConversationId = "";
    let accumulatedMessage = "";
    
    // Process the stream
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      // Convert the chunk to text
      const chunk = new TextDecoder().decode(value);
      
      // Process each event in the chunk
      const events = chunk.split('\n\n').filter(Boolean);
      for (const event of events) {
        if (event.startsWith('data:')) {
          try {
            // Trim the data part to avoid empty JSON strings
            const jsonStr = event.slice(5).trim();
            if (!jsonStr) continue;
            
            // Check if the JSON string is valid before parsing
            if (!jsonStr.startsWith('{') || !jsonStr.endsWith('}')) {
              console.warn("Invalid JSON format:", jsonStr);
              continue;
            }
            
            let data;
            try {
              data = JSON.parse(jsonStr);
            } catch (parseError) {
              console.error("JSON parse error:", (parseError as Error).message);
              // Try to sanitize the JSON string
              const sanitizedJson = jsonStr.replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');
              try {
                data = JSON.parse(sanitizedJson);
              } catch (e) {
                console.error("Failed to parse even after sanitizing");
                continue;
              }
            }
            
            if (data.event === 'message') {
              // Capture conversation ID as soon as we get it
              if (data.conversation_id && !newConversationId) {
                newConversationId = data.conversation_id;
                // Update the state immediately to ensure it's available for future requests
                setConversationId(newConversationId);
              }
              
              // Use a callback form of setState to ensure we're working with the latest state
              const newContent = data.answer || '';
              accumulatedMessage += newContent;
              
              setStreamingMessage(accumulatedMessage);
              
              messageId = data.message_id || messageId;
            } else if (data.event === 'message_end') {
              // Double-check for conversation ID
              if (data.conversation_id && (!newConversationId || newConversationId !== data.conversation_id)) {
                newConversationId = data.conversation_id;
                setConversationId(newConversationId);
              }
            }
          } catch (e) {
            console.error('Error processing stream data:', (e as Error).message);
            // Continue processing other events even if one fails
          }
        }
      }
    }
    
    return {
      message: accumulatedMessage,
      messageId
    };
  }