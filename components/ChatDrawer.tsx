import useUserStore from "@/core/userState";
import { Chat } from "@/interface/Chat";
import { ChatService } from "@/services/chat.service";
import { generateUUID } from "@/utils/constants";
import { BlurView } from "expo-blur";
import { router } from "expo-router";
import * as React from "react";
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from "react-native";

const groupChatsByRecency = (chats: Chat[]) => {
  const now = new Date();
  const oneDayAgo = new Date(now);
  oneDayAgo.setDate(now.getDate() - 1);
  
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);
  
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);
  
  const recent = chats.filter(chat => new Date(chat.createdAt) >= oneDayAgo);
  const lastWeek = chats.filter(chat => 
    new Date(chat.createdAt) < oneDayAgo && new Date(chat.createdAt) >= sevenDaysAgo
  );
  const lastMonth = chats.filter(chat => 
    new Date(chat.createdAt) < sevenDaysAgo && new Date(chat.createdAt) >= thirtyDaysAgo
  );
  const older = chats.filter(chat => new Date(chat.createdAt) < thirtyDaysAgo);
  
  return { recent, lastWeek, lastMonth, older };
};

const ChatDrawer = ({ onClose }: { onClose: () => void }) => {
  const user = useUserStore((s) => s.user);
  const theme = useUserStore((s) => s.theme);
  const chatService = new ChatService();
  const [chats, setChats] = React.useState<Array<Chat>>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isNavigating, setIsNavigating] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  const filteredChats = React.useMemo(() => {
    if (!searchQuery.trim()) return chats;
    
    return chats.filter(chat => 
      chat.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.title === null
    );
  }, [chats, searchQuery]);

  const groupedChats = React.useMemo(() => {
    return groupChatsByRecency(filteredChats);
  }, [filteredChats]);
  
  const goToChat = React.useCallback(async (id: string) => {
    if (isNavigating) return;
    
    setIsNavigating(true);
    onClose();
    setTimeout(() => {
      router.replace({
        pathname: "/(tabs)/chat",
        params: { 
          chatIdFromNav: id, 
          refresh: Date.now().toString() 
        },
      });
      setIsNavigating(false);
    }, 150);
  }, [onClose, isNavigating]);

  const handleCreateNewChat = React.useCallback(async () => {
    if (isNavigating) return;
    
    setIsNavigating(true);
    onClose();
    
    const newChatId = generateUUID();
    
    setTimeout(() => {
      router.replace({
        pathname: "/(tabs)/chat",
        params: { 
          chatIdFromNav: newChatId,
          refresh: Date.now().toString() 
        },
      });
      setIsNavigating(false);
    }, 150);
  }, [onClose, isNavigating]);

  React.useEffect(() => {
    const fetchChats = async () => {
      setIsLoading(true);
      try {
        const chatList = await chatService.getHistory(
          user?.id as unknown as string
        );
        setChats(chatList.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
      } catch (error) {
        console.error("Error fetching chats:", error);
        setChats([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user?.id) {
      fetchChats();
    }
  }, [user?.id]);

  const renderChatSection = (title: string, sectionChats: Chat[]) => {
    if (sectionChats.length === 0) return null;
    
    return (
      <View style={styles.chatSection} key={title}>
        <Text style={[styles.sectionHeader, theme === "dark" && { color: "#E0E0E0" }]}>{title}</Text>
        {sectionChats.map((chat) => (
          <TouchableOpacity
            key={chat.id}
            onPress={() => goToChat(chat.id)}
            style={[
              styles.chatItem,
              theme === "dark" && { backgroundColor: "#0D0D0D" },
              isNavigating && styles.disabledChatItem
            ]}
            disabled={isNavigating}
            activeOpacity={0.7}
          >
            <View style={styles.chatInfo}>
              <Text style={[styles.chatTitle, theme === "dark" && { color: "#B3B3B3" }]} numberOfLines={1}>
                {chat.title || "Untitled Chat"}
              </Text>
              <Text style={[styles.chatDate, theme === "dark" && { color: "#777777" }]}>
                {new Date(chat.createdAt).toLocaleDateString()}
              </Text>
            </View>
            {!isNavigating && (
              <Image
                source={theme === "dark" 
                  ? require("@/assets/images/icons/dark/arrow-right.png")
                  : require("@/assets/images/icons/arrow-right.png")
                }
                style={[styles.arrowIcon, theme === "dark" && { tintColor: "#777777" }]}
              />
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme === "dark" ? "#00FF80" : "#2D3C52"} />
          <Text style={[styles.loadingText, theme === "dark" && { color: "#E0E0E0" }]}>
            Loading chats...
          </Text>
        </View>
      );
    }

    if (chats.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyStateText, theme === "dark" && { color: "#E0E0E0" }]}>No chat history yet</Text>
          <Text style={[styles.emptyStateSubtext, theme === "dark" && { color: "#B3B3B3" }]}>
            Start a new conversation!
          </Text>
          <TouchableOpacity 
            style={[styles.newChatButton, isNavigating && styles.disabledButton]}
            onPress={handleCreateNewChat}
            disabled={isNavigating}
          >
            {isNavigating ? (
              <ActivityIndicator size="small" color="#2D3C52" />
            ) : (
              <Text style={styles.newChatButtonText}>+ New Chat</Text>
            )}
          </TouchableOpacity>
        </View>
      );
    }

    if (filteredChats.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyStateText, theme === "dark" && { color: "#E0E0E0" }]}>No chats found</Text>
          <Text style={[styles.emptyStateSubtext, theme === "dark" && { color: "#B3B3B3" }]}>
            Try adjusting your search terms
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.chatListContainer} showsVerticalScrollIndicator={false}>
        {renderChatSection("Recent", groupedChats.recent)}
        {renderChatSection("Last 7 Days", groupedChats.lastWeek)}
        {renderChatSection("Last 30 Days", groupedChats.lastMonth)}
        {renderChatSection("Older", groupedChats.older)}
      </ScrollView>
    );
  };

  return (
    <>
      <BlurView
        intensity={15}
        tint="dark"
        style={styles.blurBackdrop}
        onTouchStart={isNavigating ? undefined : onClose}
      />

      <View style={[styles.drawer, theme === "dark" && { backgroundColor: "#131313" }]}>
        <View style={[styles.drawerHeader, theme === "dark" && { borderBottomColor: "#2E3033" }]}>
          <TextInput
            placeholder="Search chats..."
            placeholderTextColor={theme === "dark" ? "#B3B3B3" : "#61728C"}
            style={[styles.searchInput, theme === "dark" && { 
              backgroundColor: "#0D0D0D", 
              borderColor: "#2E3033",
              color: "#E0E0E0"
            }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            editable={!isNavigating}
          />
          <TouchableOpacity 
            style={[
              styles.button, 
              theme === "dark" && { 
                backgroundColor: "#0D0D0D", 
                borderColor: "#2E3033" 
              },
              isNavigating && styles.disabledButton
            ]} 
            activeOpacity={0.8}
            onPress={handleCreateNewChat}
            disabled={isNavigating}
          >
            {isNavigating ? (
              <ActivityIndicator size="small" color={theme === "dark" ? "#E0E0E0" : "#2D3C52"} />
            ) : (
              <Image
                source={theme === "dark" 
                  ? require("@/assets/images/icons/dark/pen.png")
                  : require("@/assets/images/icons/pen.png")
                }
                style={{width: 20, height: 20}}
              />
            )}
          </TouchableOpacity>
        </View>

        {renderContent()}
        
        {chats.length > 0 && (
          <TouchableOpacity 
            style={[
              styles.newChatButton,
              isNavigating && styles.disabledButton
            ]}
            onPress={handleCreateNewChat}
            disabled={isNavigating}
          >
            {isNavigating ? (
              <ActivityIndicator size="small" color="#2D3C52" />
            ) : (
              <Text style={styles.newChatButtonText}>+ New Chat</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </>
  );
};

export default ChatDrawer;

const styles = StyleSheet.create({
  blurBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
  },
  drawer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 300,
    backgroundColor: "#fff",
    zIndex: 10,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    borderRadius: 16,
    marginLeft: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  drawerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#EDF3FC",
  },
  chatListContainer: {
    flex: 1,
    paddingBottom: 80, 
  },
  chatSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontFamily: "Satoshi",
    fontSize: 14,
    fontWeight: "500",
    color: "#2D3C52",
    paddingHorizontal: 20,
    paddingVertical: 8,
    lineHeight: 24
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 2,
  },
  disabledChatItem: {
    opacity: 0.6,
  },
  chatIcon: {
    marginRight: 12,
  },
  chatInfo: {
    flex: 1,
  },
  chatTitle: {
    fontFamily: "Satoshi",
    fontSize: 14,
    color: "#2D3C52",
    marginBottom: 4,
  },
  chatDate: {
    fontFamily: "Satoshi",
    fontSize: 12,
    color: "#777777",
  },
  arrowIcon: {
    width: 16,
    height: 16,
    tintColor: "#777777",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 16,
  },
  loadingText: {
    fontFamily: "Satoshi",
    fontSize: 16,
    color: "#2D3C52",
  },
  searchInput: {
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 20,
    fontFamily: "Urbanist",
    backgroundColor: "#FFFFFF",
    borderColor: "#EDF3FC",
    borderWidth: 1,
    borderRadius: 12,
    flex: 1,
    padding: 10,
    fontSize: 16,
    color: "#2D3C52",
    marginRight: 12,
  },
  emptyStateText: {
    fontFamily: "Satoshi",
    fontSize: 16,
    fontWeight: "500",
    color: "#2D3C52",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontFamily: "Satoshi",
    fontSize: 14,
    color: "#777777",
    textAlign: "center",
    marginBottom: 20,
  },
  newChatButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#00FF80",
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  newChatButtonText: {
    fontFamily: "Satoshi",
    fontWeight: "600",
    fontSize: 16,
    color: "#2D3C52",
  },
  button: {
    borderRadius: 50,
    borderWidth: 0.5,
    borderColor: "#EDF3FC",
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    width: 50,
    height: 50,
    backgroundColor: "#FFFFFF",
  },
  disabledButton: {
    opacity: 0.6,
  },
});
