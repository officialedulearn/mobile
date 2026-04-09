import { Message } from "@/interface/Chat";
import { generateUUID } from "@/utils/constants";
import { supabase } from "@/utils/supabase";
import { BaseService } from "./base.service";
import EventSource from "react-native-sse";

function scheduleAfterReactRender(fn: () => void) {
  setTimeout(fn, 0);
}

export class AIService extends BaseService {
  async getTitle(message: Message) {
    const response = await this.executeRequest(
      this.getClient().post("/ai/title", message)
    );
    if (response.error) throw response.error;
    return response.data;
  }

  async generateMessages(dto: {
    messages: Array<Message>;
    chatId: string;
    userId: string;
  }) {
    const response = await this.executeRequest(
      this.getClient().post("/ai/message", dto)
    );
    if (response.error) throw response.error;
    return response.data;
  }

  async generateQuiz(dto: { chatId: string; userId: string }) {
    const response = await this.executeRequest(
      this.getClient().post("/ai/quiz", dto)
    );
    if (response.error) throw response.error;
    return response.data;
  }

  async generateSuggestions(dto: { userId: string }) {
    const response = await this.executeRequest(
      this.getClient().post("/ai/suggestions", dto)
    );
    if (response.error) throw response.error;
    return response.data;
  }

  async generateMessagesStream(
    dto: {
      messages: Array<Message>;
      chatId: string;
      userId: string;
    },
    onToken: (token: string, type?: string) => void,
    onComplete: (fullMessage: Message) => void,
    onError: (error: Error) => void
  ) {
    try {
      const initResponse = await this.getClient().post("/ai/message-stream/init", dto);
      const { streamId } = initResponse.data;

      const API_URL = this.getClient().defaults.baseURL;
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("No access token found. Please log in again.");
      }

      const eventSource = new EventSource(
        `${API_URL}/ai/message-stream/${streamId}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      let fullResponse = "";
      let responseId = "";
      let streamCompleted = false;

      eventSource.addEventListener("message", (event: any) => {
        try {
          const data = JSON.parse(event.data);

          if (data.complete || data.id) {
            if (data.id) {
              responseId = data.id;
            }

            if (data.complete) {
              streamCompleted = true;
              eventSource.close();

              scheduleAfterReactRender(() => {
                onComplete({
                  id: data.id || responseId || generateUUID(),
                  role: "assistant",
                  content: fullResponse,
                  createdAt: new Date(),
                  chatId: dto.chatId,
                });
              });
              return;
            }
          }

          if (data.token) {
            fullResponse += data.token;
            const token = data.token;
            const tokenType = data.type;
            scheduleAfterReactRender(() => {
              onToken(token, tokenType);
            });
          }
        } catch (parseError) {
        }
      });

      eventSource.addEventListener("error", () => {
        eventSource.close();

        scheduleAfterReactRender(() => {
          if (streamCompleted) {
            return;
          }

          if (fullResponse) {
            onComplete({
              id: responseId || generateUUID(),
              role: "assistant",
              content: fullResponse,
              createdAt: new Date(),
              chatId: dto.chatId,
            });
          } else {
            onError(new Error("Connection error during streaming. Please try again."));
          }
        });
      });

      return () => {
        eventSource.close();
      };
    } catch (error: any) {
      let errorMessage = "Failed to generate response. Please try again.";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      scheduleAfterReactRender(() => {
        onError(new Error(errorMessage));
      });
    }
  }

  async transcribeAudio(dto: { audioUri: string }): Promise<{ transcription: string }> {
    try {
      const getFileTypeFromUri = (uri: string) => {
        const extension = uri.split(".").pop()?.toLowerCase();
        switch (extension) {
          case "m4a":
            return { type: "audio/m4a", name: "recording.m4a" };
          case "mp3":
            return { type: "audio/mpeg", name: "recording.mp3" };
          case "wav":
            return { type: "audio/wav", name: "recording.wav" };
          case "aac":
            return { type: "audio/aac", name: "recording.aac" };
          case "mp4":
            return { type: "audio/mp4", name: "recording.mp4" };
          default:
            return { type: "audio/m4a", name: "recording.m4a" };
        }
      };

      const fileInfo = getFileTypeFromUri(dto.audioUri);
      const formData = new FormData();

      formData.append("audio", {
        uri: dto.audioUri,
        type: fileInfo.type,
        name: fileInfo.name,
      } as any);

      const response = await this.executeRequest(
        this.getClient().post("/ai/transcribe-audio", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })
      );

      if (response.error) throw response.error;
      return response.data!;
    } catch (error: any) {
      let errorMessage = "Failed to process your audio message. Please try again.";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      } else {
        if (error.response?.status === 400) {
          errorMessage = "Invalid audio file. Please try recording again.";
        } else if (error.response?.status === 413) {
          errorMessage = "Audio file too large. Please record a shorter message.";
        } else if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
          errorMessage = "Audio processing timed out. Please try again.";
        } else if (error.message?.includes("Network Error") || !error.response) {
          errorMessage = "Network error. Please check your internet connection and try again.";
        }
      }

      const processedError = new Error(errorMessage);
      processedError.name = "AudioTranscriptionError";
      throw processedError;
    }
  }
}
