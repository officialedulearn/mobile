import useUserStore from "@/core/userState";
import { Chat } from "@/interface/Chat";
import { ChatService } from "@/services/chat.service";
import { BlurView } from "expo-blur";
import { router } from "expo-router";
import * as React from "react";
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

// Helper function to group chats by recency
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
  const chatService = new ChatService();
  const [chats, setChats] = React.useState<Array<Chat>>([]);
  const [searchQuery, setSearchQuery] = React.useState("");

  const groupedChats = React.useMemo(() => {
    return groupChatsByRecency(chats);
  }, [chats]);
  
  const goToChat = (id: string) => {
    onClose();
    router.push({
      pathname: "/(tabs)/chat",
      params: { chatIdFromNav: id, refresh: Date.now().toString() },
    });
  };

  React.useEffect(() => {
    const fetchChats = async () => {
      try {
        const chatList = await chatService.getHistory(
          user?.id as unknown as string
        );
        setChats(chatList.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
      } catch (error) {
        console.error("Error fetching chats:", error);
      }
    };
    fetchChats();
  }, []);

  const renderChatSection = (title: string, sectionChats: Chat[]) => {
    if (sectionChats.length === 0) return null;
    
    return (
      <View style={styles.chatSection}>
        <Text style={styles.sectionHeader}>{title}</Text>
        {sectionChats.map((chat) => (
          <TouchableOpacity
            key={chat.id}
            onPress={() => goToChat(chat.id)}
            style={styles.chatItem}
          >
            <Image
              source={require("@/assets/images/icons/brain.png")}
              style={styles.chatIcon}
            />
            <View style={styles.chatInfo}>
              <Text style={styles.chatTitle} numberOfLines={1}>
                {chat.title || "Untitled Chat"}
              </Text>
            
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <>
      <BlurView
        intensity={15}
        tint="dark"
        style={styles.blurBackdrop}
        onTouchStart={onClose}
      />

      <View style={styles.drawer}>
        <View style={styles.drawerHeader}>
          <TextInput
            placeholder="Search chats..."
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={styles.button} activeOpacity={0.8}>
            <Image
              source={require("@/assets/images/icons/pen.png")}

            />
          </TouchableOpacity>
        </View>

        {chats.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No chat history yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Start a new conversation!
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.chatListContainer} showsVerticalScrollIndicator={false}>
            {renderChatSection("Recent", groupedChats.recent)}
            {renderChatSection("Last 7 Days", groupedChats.lastWeek)}
            {renderChatSection("Last 30 Days", groupedChats.lastMonth)}
            {renderChatSection("Older", groupedChats.older)}
          </ScrollView>
        )}
        
        {/* <TouchableOpacity 
          style={styles.newChatButton}
          onPress={() => {
            onClose();
            router.push("/chat");
          }}
        >
          <Text style={styles.newChatButtonText}>+ New Chat</Text>
        </TouchableOpacity> */}
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
    width: 450,
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
    paddingBottom: 80, // Space for the new chat button
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
    // Removed the border bottom
  },
  chatIcon: {
    marginRight: 12,
  },
  chatInfo: {
    flex: 1,
  },
  chatTitle: {
    fontFamily: "Satoshi",
    fontSize: 16,
    color: "#2D3C52",
    marginBottom: 4,
  },
  
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
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
});
