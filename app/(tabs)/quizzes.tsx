import useActivityStore from "@/core/activityState";
import useUserStore from "@/core/userState";
import { Chat } from "@/interface/Chat";
import { ChatService } from "@/services/chat.service";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
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
import { DataTable } from "react-native-paper";

type Props = {};

const quizzes = (props: Props) => {
  const [chats, setChats] = React.useState<Array<Chat>>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [page, setPage] = useState<number>(0);
  const [numberOfItemsPerPageList] = useState([10, 15, 20]);
  const [itemsPerPage, onItemsPerPageChange] = useState(numberOfItemsPerPageList[0]);
  
  const chatService = new ChatService();
  const {updateUserCredits, theme, user} = useUserStore()
  const { quizActivities, isLoading, fetchQuizActivities } = useActivityStore();
  const screenWidth = Dimensions.get("window").width;
  const cardWidth = screenWidth * 0.75;

  const from = page * itemsPerPage;
  const to = Math.min((page + 1) * itemsPerPage, quizActivities.length);

  useEffect(() => {
    setPage(0);
  }, [itemsPerPage]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user?.id) return;
        
        const userId = user.id;
        const chatList = await chatService.getHistory(userId);
        setChats(
          chatList.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ).filter(chat => !chat.tested)
        );

        fetchQuizActivities(userId);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [user?.id, fetchQuizActivities]);

  const startQuiz = () => {

    const currentCredits = Number(user?.credits) || 0;
    console.log(
      "Current credits (raw):",
      user?.credits,
      "Parsed:",
      currentCredits,
    );

    if (currentCredits <= 0.5) {
      console.log(
        "User has insufficient credits, redirecting to freeTrialIntro",
      );
      router.push("/freeTrialIntro");
      return;
    }

    updateUserCredits(currentCredits - 0.5);

    router.push({
      pathname: "/quiz",
      params: {chatId: chat.id}
    })
  }

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / (cardWidth + 20));
    setActiveIndex(index);
  };
  const testedChats = chats.filter(chat => !chat.tested);
  return (  
    <ScrollView 
      style={[styles.container, theme === "dark" && { backgroundColor: "#0D0D0D" }]}
      showsVerticalScrollIndicator={false}
    >
      {theme === "dark" ? <StatusBar style="light" /> : <StatusBar style="dark" />} 
      <Text style={[styles.header, theme === "dark" && {color: "#E0E0E0"}]}>Quizzes</Text>
      <Text style={[styles.subtext, theme === "dark" && {color: "#B3B3B3"}]}>
        Practice what you've learned. Earn XP. Get smarter.
      </Text>


      <Text style={[styles.sectionHeader, theme === "dark" && {color: "#E0E0E0"}]}>Quizzes From Your AI Sessions</Text>

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
            {testedChats.map((chat) => (
              <View
                key={chat.id}
                style={[styles.chatItem, { width: cardWidth}, theme === "dark" && {backgroundColor: "#131313", borderColor: "#2E3033"}]}
              >
                <View style={styles.chatItemHeader}>
                  <Image
                    source={require("@/assets/images/icons/brain1.png")}
                    style={styles.chatIcon}
                  />
                  <Text style={[styles.chatText, theme === "dark" && {color: "#E0E0E0"}]} numberOfLines={1}>
                    {chat.title || "Untitled Chat"}
                  </Text>
                </View>

                <Text style={[styles.dateText, theme === "dark" && {color: "#B3B3B3"}]}>
                  From your chat on{" "}
                  {new Date(chat.createdAt).toLocaleDateString()}
                </Text>

                <View style={styles.metadataRow}>
                  <View style={styles.metadataItem}>
                    <Image
                      source={require("@/assets/images/icons/medal-05.png")}
                      style={styles.metadataIcon}
                    />
                    <Text style={[styles.xpText, theme === "dark" && {color: "#E0E0E0"}]}>Earn up to 10 XP</Text>
                  </View>

                  <View style={styles.metadataItem}>
                    <Image
                      source={theme === "dark" ? require("@/assets/images/icons/dark/clock.png") : require("@/assets/images/icons/clock.png")}
                      style={styles.metadataIcon}
                    />
                    <Text style={[styles.xpText, theme === "dark" && {color: "#E0E0E0"}]}>~ 1 min</Text>
                  </View>
                </View>

                <TouchableOpacity style={
                  [styles.startButton, {marginBottom: 10}, theme === "dark" && {backgroundColor: "#00FF80"}]
                } onPress={() => {
                  startQuiz()
                }}>
                  <Text style={[styles.startButtonText, theme === "dark" && {color: "#000"}]}>Start Quiz</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          {/* <View style={styles.paginationContainer}>
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
          </View> */}
        </>
      ) : (
        <Text style={styles.emptyText}>
          No quizzes available.
        </Text>
      )}

      <View style={styles.historyHeader}>
        <Text style={[styles.sectionHeader, theme === "dark" && {color: "#E0E0E0"}]}>Quiz History</Text>

        <TouchableOpacity style={[styles.searchButton, theme === "dark" && {backgroundColor: "#131313", borderColor: "#2E3033"}]}>
          <Image
            source={theme === "dark" ? require("@/assets/images/icons/dark/search.png") : require("@/assets/images/icons/search-normal.png")}
            style={styles.searchIcon}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.historyList}>
        {quizActivities.length > 0 ? (
          <>
            {quizActivities.slice(from, to).map((activity, index) => (
              <View key={index} style={[styles.activityCard, theme === "dark" && {backgroundColor: "#131313", borderColor: "#2E3033"}]}>
                <View style={styles.activityContainer}>

                  <View style={styles.activityLeftColumn}>
                    <Text style={[styles.chatText, theme === "dark" && {color: "#E0E0E0"}]} numberOfLines={1}>
                      {activity.title || "Untitled Quiz"}
                    </Text>
                    
                    <View style={styles.metadataItem}>
                      <Image 
                        source={theme === "dark" ? require("@/assets/images/icons/dark/clock.png") : require("@/assets/images/icons/clock.png")} 
                        style={styles.metadataIcon}
                      />
                      <Text style={[styles.xpText, theme === "dark" && {color: "#E0E0E0"}]}>1 min</Text>
                    </View>
                    
                    <View style={styles.metadataItem}>
                      <Image
                        source={require("@/assets/images/icons/medal-05.png")}
                        style={styles.metadataIcon}
                      />
                      <Text style={[styles.xpText, theme === "dark" && {color: "#B3B3B3"}]}>+{activity.xpEarned} XP</Text>
                    </View>
                  </View>

                  <View style={styles.activityRightColumn}>
                    <View style={styles.metadataItem}>
                      <Image 
                        source={theme === "dark" ? require("@/assets/images/icons/dark/calendar.png") : require("@/assets/images/icons/calendar.png")} 
                        style={styles.metadataIcon}
                      />
                      <Text style={[styles.dateText, theme === "dark" && {color: "#B3B3B3"}]}>
                        {new Date(activity.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    
                    <View style={styles.metadataItem}>
                      <Image 
                        source={theme === "dark" ? require("@/assets/images/icons/dark/notebook.png") : require("@/assets/images/icons/notebook.png")}
                        style={styles.metadataIcon}
                      />
                      <Text style={[styles.scoreText, theme === "dark" && {color: "#E0E0E0"}]}>
                        {activity.xpEarned}/5 ({activity.xpEarned * 20}%)
                      </Text>
                    </View>
                    
                    <View style={[
                      styles.statusBadge,
                      activity.xpEarned >= 3 ? styles.statusPassed : styles.statusFailed
                    ]}>
                      <View style={[
                        styles.statusDot,
                        activity.xpEarned >= 3 ? styles.statusDotPassed : styles.statusDotFailed
                      ]} />
                      <Text style={[
                        styles.statusText,
                        activity.xpEarned >= 3 ? styles.statusTextPassed : styles.statusTextFailed
                      ]}>
                        {activity.xpEarned >= 3 ? "Passed" : "Failed"}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}

            {quizActivities.length > itemsPerPage && (
              <View style={[styles.tableContainer, theme === "dark" && { backgroundColor: "#131313" }]}>
                <DataTable style={[styles.table, theme === "dark" && { backgroundColor: "#131313" }]}>
                  <View style={styles.paginationContainer}>
                    <DataTable.Pagination
                      page={page}
                      numberOfPages={Math.ceil(quizActivities.length / itemsPerPage)}
                      onPageChange={(page) => setPage(page)}
                      onItemsPerPageChange={onItemsPerPageChange}
                      showFastPaginationControls
                      style={styles.pagination}
                    />
                  </View>
                </DataTable>
              </View>
            )}
          </>
        ) : (
          <Text style={[styles.emptyText, theme === "dark" && {color: "#B3B3B3"}]}>
            No quiz history available.
          </Text>
        )}
      </View>
      
      <View style={{height: 30}} />
    </ScrollView>
  );
};

export default quizzes;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F9FBFC",
    paddingTop: 50,
    padding: 20,
    paddingLeft: 30,
    height: "100%",
  },
  header: {
    fontSize: 24,
    fontWeight: "600",
    color: "#2D3C52",
    fontFamily: "Satoshi-Regular",
    lineHeight: 32,
  },
  subtext: {
    fontSize: 14,
    color: "#2D3C52",
    marginTop: 8,
    fontFamily: "Satoshi-Regular",
    lineHeight: 24,
    fontWeight: "400",
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2D3C52",
    fontFamily: "Satoshi-Regular",
    lineHeight: 28,
    marginTop: 20,
    marginBottom: 10,
  },
  chatText: {
    fontSize: 16,
    color: "#2D3C52",
    marginLeft: 10,
    fontFamily: "Satoshi-Regular",
    lineHeight: 26,
    fontWeight: "500",
  },
  dateText: {
    fontSize: 14,
    color: "#61728C",
    marginLeft: 10,
    fontFamily: "Satoshi-Regular",
    lineHeight: 24,
    fontWeight: "400",
  },
  xpText: {
    fontSize: 14,
    color: "#2D3C52",
    fontFamily: "Satoshi-Regular",
    lineHeight: 24,
    fontWeight: "500",
  },
  chatItem: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    paddingHorizontal: 12,

    borderRadius: 12,
    marginTop: 5,
    borderWidth: 1,
    borderColor: "#E0E7F0",
    gap: 12,
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
  },
  horizontalScrollView: {
    gap: 10,
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
    marginBottom: 3,
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
    fontFamily: "Satoshi-Regular",
    fontWeight: "500",
    padding: 12,
    textAlign: "center",
    lineHeight: 24,
  },
  scrollViewContent: {
    gap:10,
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
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusPassed: {
    backgroundColor: "#F2FFF7",
  },
  statusFailed: {
    backgroundColor: "#FBEAE9",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusDotPassed: {
    backgroundColor: "#0E7B33",
  },
  statusDotFailed: {
    backgroundColor: "#940803",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "Satoshi-Regular",
  },
  statusTextPassed: {
    color: "#0E7B33",
  },
  statusTextFailed: {
    color: "#940803",
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
  activityContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  activityLeftColumn: {
    flex: 1,
    paddingRight: 10,
    justifyContent: "center",
    gap: 5,
    alignItems: "flex-start"
  },
  activityRightColumn: {
    flex: 1,
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 5,
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
    fontFamily: "Satoshi-Regular",
    lineHeight: 24,
    fontWeight: "500",
  },
  emptyText: {
    marginTop: 10,
    fontFamily: "Satoshi-Regular",
    textAlign: "center",
    color: "#61728C",
  },
  tableContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  table: {
    backgroundColor: "#FFFFFF",
  },
  pagination: {
    backgroundColor: "#FFFFFF",
  },
});
