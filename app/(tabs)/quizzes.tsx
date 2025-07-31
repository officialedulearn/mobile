import useUserStore from "@/core/userState";
import { Chat } from "@/interface/Chat";
import { ActivityService } from "@/services/activity.service";
import { ChatService } from "@/services/chat.service";
import { StatusBar } from "expo-status-bar";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {};

const quizzes = (props: Props) => {
  const [chats, setChats] = React.useState<Array<Chat>>([]);
  const [activities, setActivities] = React.useState<Array<any>>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const chatService = new ChatService();
  const activityService = new ActivityService();
  const user = useUserStore((s) => s.user);
  const screenWidth = Dimensions.get("window").width;
  const cardWidth = screenWidth * 0.75;

  React.useEffect(() => {
    const fetchChats = async () => {
      try {
        const chatList = await chatService.getHistory(
          user?.id as unknown as string
        );
        setChats(
          chatList.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        );

        const activityList = await activityService.getQuizActivitiesByUser(
          user?.id as unknown as string
        );

        setActivities(
          activityList.sort(
            (
              a: { createdAt: string | number | Date },
              b: { createdAt: string | number | Date }
            ) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        );
      } catch (error) {
        console.error("Error fetching chats:", error);
      }
    };

    fetchChats();
  }, []);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / (cardWidth + 20));
    setActiveIndex(index);
  };

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar style="dark" />
      <Text style={styles.header}>Quizzes</Text>
      <Text style={styles.subtext}>
        Practice what you've learned. Earn XP. Get smarter.
      </Text>


      <Text style={styles.sectionHeader}>Quizzes From Your AI Sessions</Text>

      {chats.length > 0 ? (
        <>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollViewContent}
            snapToInterval={cardWidth + 20}
            decelerationRate="fast"
            onScroll={handleScroll}
            scrollEventThrottle={16}
            style={styles.horizontalScrollView}
          >
            {chats.map((chat) => (
              <View
                key={chat.id}
                style={[styles.chatItem, { width: cardWidth }]}
              >
                <View style={styles.chatItemHeader}>
                  <Image
                    source={require("@/assets/images/icons/brain1.png")}
                    style={styles.chatIcon}
                  />
                  <Text style={styles.chatText} numberOfLines={1}>
                    {chat.title || "Untitled Chat"}
                  </Text>
                </View>

                <Text style={styles.dateText}>
                  From your chat on{" "}
                  {new Date(chat.createdAt).toLocaleDateString()}
                </Text>

                <View style={styles.metadataRow}>
                  <View style={styles.metadataItem}>
                    <Image
                      source={require("@/assets/images/icons/medal-05.png")}
                      style={styles.metadataIcon}
                    />
                    <Text style={styles.xpText}>Earn up to 5 XP</Text>
                  </View>

                  <View style={styles.metadataItem}>
                    <Image
                      source={require("@/assets/images/icons/clock.png")}
                      style={styles.metadataIcon}
                    />
                    <Text style={styles.xpText}>~ 1 min</Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.startButton}>
                  <Text style={styles.startButtonText}>Start Quiz</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          <View style={styles.paginationContainer}>
            {chats.map((_, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.paginationDot,
                  activeIndex === index ? styles.paginationDotActive : {},
                ]}
                onPress={() => {
                  scrollViewRef.current?.scrollTo({
                    x: index * (cardWidth + 20),
                    animated: true,
                  });
                  setActiveIndex(index);
                }}
              />
            ))}
          </View>
        </>
      ) : (
        <Text style={styles.emptyText}>
          No quizzes available.
        </Text>
      )}

      <View style={styles.historyHeader}>
        <Text style={styles.sectionHeader}>Quiz History</Text>

        <TouchableOpacity style={styles.searchButton}>
          <Image
            source={require("@/assets/images/icons/search-normal.png")}
            style={styles.searchIcon}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.historyList}>
        {activities.length > 0 ? (
          activities.map((activity, index) => (
            <View key={index} style={styles.activityCard}>
              <View style={styles.activityMain}>
                <Text style={styles.activityTitle} numberOfLines={1}>
                  {activity.title || "Untitled Quiz"}
                </Text>
                <View style={styles.activityMetadata}>
                  <View style={styles.metadataItem}>
                    <Image 
                      source={require("@/assets/images/icons/clock.png")} 
                      style={styles.metadataIcon}
                    />
                    <Text style={styles.xpText}>1 min</Text>
                  </View>
                  <View style={styles.metadataItem}>
                    <Image
                      source={require("@/assets/images/icons/medal-05.png")}
                      style={styles.metadataIcon}
                    />
                    <Text style={styles.xpText}>+{activity.xpEarned} XP</Text>
                  </View>
                </View>
              </View>

              <View style={styles.activityDetails}>
                <View style={styles.metadataItem}>
                  <Image 
                    source={require("@/assets/images/icons/calendar.png")} 
                    style={styles.metadataIcon}
                  />
                  <Text style={styles.dateText}>
                    {new Date(activity.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.metadataItem}>
                  <Image 
                    source={require("@/assets/images/icons/notebook.png")}
                    style={styles.metadataIcon}
                  />
                  <Text style={styles.scoreText}>
                    {activity.xpEarned}/10 ({activity.xpEarned * 10}%)
                  </Text>
                </View>
                {activity.xpEarned >= 7 && (
                  <View style={styles.passed}>
                    <Text style={styles.passedText}>Passed</Text>
                  </View>
                )}
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>
            No quiz history available.
          </Text>
        )}
      </View>
      
      {/* Add some bottom padding for scrolling */}
      <View style={{height: 30}} />
    </ScrollView>
  );
};

export default quizzes;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F9FBFC",
    marginTop: 40,
    padding: 20,
    paddingLeft: 30,
    height: "100%",
  },
  header: {
    fontSize: 24,
    fontWeight: "600",
    color: "#2D3C52",
    fontFamily: "Satoshi",
    lineHeight: 32,
  },
  subtext: {
    fontSize: 14,
    color: "#2D3C52",
    marginTop: 8,
    fontFamily: "Satoshi",
    lineHeight: 24,
    fontWeight: "400",
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2D3C52",
    fontFamily: "Satoshi",
    lineHeight: 28,
    marginTop: 20,
    marginBottom: 10,
  },
  chatText: {
    fontSize: 16,
    color: "#2D3C52",
    marginLeft: 10,
    fontFamily: "Satoshi",
    lineHeight: 26,
    fontWeight: "500",
  },
  dateText: {
    fontSize: 14,
    color: "#61728C",
    marginLeft: 10,
    fontFamily: "Satoshi",
    lineHeight: 24,
    fontWeight: "400",
  },
  xpText: {
    fontSize: 14,
    color: "#2D3C52",
    marginLeft: 10,
    fontFamily: "Satoshi",
    lineHeight: 24,
    fontWeight: "500",
  },
  chatItem: {
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 12,
    marginTop: 5,
    marginRight: 15,
    borderWidth: 1,
    borderColor: "#E0E7F0",
    gap: 6,
    alignContent: "flex-start"
  },
  activityCard: {
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E0E7F0",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  horizontalScrollView: {
    height: 200, // Fixed height to make cards more compact
    marginBottom: 5,
  },
  chatItemHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  chatIcon: {
    width: 20,
    height: 20,
    borderRadius: 25,
  },
  metadataRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    justifyContent: "space-between",
  },
  metadataItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  metadataIcon: {
    width: 20,
    height: 20,
    marginRight: 5,
  },
  startButton: {
    borderRadius: 12,
    backgroundColor: "#000",
    textAlign: "center",
    marginTop: 8,
  },
  startButtonText: {
    color: "#00FF80",
    fontSize: 16,
    fontFamily: "Satoshi",
    fontWeight: "500",
    padding: 12,
    textAlign: "center",
    lineHeight: 24,
  },
  scrollViewContent: {
    paddingLeft: 20,
    paddingRight: 40,
    paddingVertical: 10,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E0E7F0",
    marginHorizontal: 4,
  },
  paginationDotActive: {
    width: 12,
    height: 12,
    backgroundColor: "#00FF80",
    borderRadius: 6,
  },
  passed: {
    backgroundColor: "#40B869",
    padding: 5, 
    textAlign: "center",
    borderRadius: 33,
  },
  passedText: {
    color: "#0E7B33",
    fontFamily: "Satoshi",
    fontSize: 14,
    lineHeight: 24,
    fontWeight: "400",

  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20, 
  },
  searchButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#EDF3FC",
    borderRadius: 8,
    padding: 10,
  },
  searchIcon: {
    width: 20,
    height: 20,
  },
  historyList: {
    marginTop: 10,
  },
  activityMain: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  activityMetadata: {
    flexDirection: "row",
    alignItems: "center",
  },
  activityDetails: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  scoreText: {
    fontSize: 14,
    color: "#2D3C52",
    fontFamily: "Satoshi",
    lineHeight: 24,
    fontWeight: "500",
  },
  emptyText: {
    marginTop: 10,
    fontFamily: "Satoshi",
    textAlign: "center",
    color: "#61728C",
  }
});
