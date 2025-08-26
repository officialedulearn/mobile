import BackButton from "@/components/backButton";
import React, { useEffect, useState } from "react";
import { Image, StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { DataTable } from "react-native-paper";
import { UserService } from "@/services/auth.service";
import { User } from "@/interface/User";

const Leaderboard = () => {
  const [page, setPage] = useState<number>(0);
  const [numberOfItemsPerPageList] = useState([5, 10, 15]);
  const [itemsPerPage, onItemsPerPageChange] = useState(
    numberOfItemsPerPageList[0]
  );

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userService = new UserService();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const response = await userService.getLeaderboard();
        setUsers(response.users);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
        setError('Failed to load leaderboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const from = page * itemsPerPage;
  const to = Math.min((page + 1) * itemsPerPage, users.length);

  useEffect(() => {
    setPage(0);
  }, [itemsPerPage]);

  const getLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'expert':
        return '#FF6B6B';
      case 'advanced':
        return '#00FF66';
      case 'intermediate':
        return '#61728C';
      case 'beginner':
        return '#A78BFA';
      default:
        return '#61728C';
    }
  };

  const getTopThreeUsers = () => {
    const topThree = users.slice(0, 3);
    return {
      first: topThree[0] || null,
      second: topThree[1] || null,
      third: topThree[2] || null
    };
  };

  const getRemainingUsers = () => {
    return users.slice(3).map((user, index) => ({
      key: index + 4,
      rank: index + 4,
      name: user.name,
      xp: user.xp,
    }));
  };

  const { first, second, third } = getTopThreeUsers();
  const remainingUsers = getRemainingUsers();

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.topNav}>
          <BackButton />
          <Text style={styles.heading}>Leaderboard</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00FF66" />
          <Text style={styles.loadingText}>Loading leaderboard...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.topNav}>
          <BackButton />
          <Text style={styles.heading}>Leaderboard</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topNav}>
        <BackButton />
        <Text style={styles.heading}>Leaderboard</Text>
      </View>

      <Text style={styles.subText}>
        See how you rank against other learners and climb your way to the top.
      </Text>

      <View style={styles.board}>
        <View style={styles.topthree}>
          {second && (
            <View style={styles.second}>
              <Image source={require("@/assets/images/silver.png")} style={styles.medal} />
              <View style={styles.avatarWrapper}>
                <Image source={require("@/assets/images/memoji.png")} style={styles.avatar} />
              </View>
              <Text style={styles.name}>{second.name}</Text>
              <Text style={[styles.level, { color: getLevelColor(second.level) }]}>
                {second.level || 'Novice'}
              </Text>
              <View style={styles.xpContainer}>
                <Image source={require("@/assets/images/icons/medal-05.png")} style={styles.badgeIcon} />
                <Text style={styles.xp}>{second.xp} XP</Text>
              </View>
            </View>
          )}

          {first && (
            <View style={styles.first}>
              <Image source={require("@/assets/images/gold.png")} style={styles.medal} />
              <View style={styles.avatarWrapper}>
                <Image source={require("@/assets/images/memoji.png")} style={styles.avatar} />
              </View>
              <Text style={[styles.name, { color: "#00FF66" }]}>{first.name}</Text>
              <Text style={[styles.level, { color: "#00FF66" }]}>
                {first.level || 'Novice'}
              </Text>
              <View style={styles.xpContainer}>
                <Image source={require("@/assets/images/icons/medal-05.png")} style={styles.badgeIcon} />
                <Text style={[styles.xp, { color: "#00FF66" }]}>{first.xp} XP</Text>
              </View>
            </View>
          )}

          {third && (
            <View style={styles.third}>
              <Image source={require("@/assets/images/bronze.png")} style={styles.medal} />
              <View style={styles.avatarWrapper}>
                <Image source={require("@/assets/images/memoji.png")} style={styles.avatar} />
              </View>
              <Text style={styles.name}>{third.name}</Text>
              <Text style={[styles.level, { color: getLevelColor(third.level) }]}>
                {third.level || 'Novice'}
              </Text>
              <View style={styles.xpContainer}>
                <Image source={require("@/assets/images/icons/medal-05.png")} style={styles.badgeIcon} />
                <Text style={styles.xp}>{third.xp} XP</Text>
              </View>
            </View>
          )}
        </View>
        
        {remainingUsers.length > 0 && (
          <View style={styles.tableContainer}>
            <DataTable style={styles.table}>
              {remainingUsers.slice(from, to).map((user) => (
                <DataTable.Row key={user.key} style={styles.tableRow}>
                  <DataTable.Cell style={styles.rankColumn}>
                    <Text style={styles.rankText}>{user.rank}</Text>
                  </DataTable.Cell>
                  <DataTable.Cell style={styles.nameColumn}>
                    <Text style={styles.nameText}>{user.name}</Text>
                  </DataTable.Cell>
                  <DataTable.Cell style={styles.xpColumn}>
                    <View style={styles.xpColumnContent}>
                      <Image 
                        source={require("@/assets/images/icons/medal-05.png")} 
                        style={styles.tableIcon} 
                      />
                      <Text style={styles.xpText}>{user.xp} XP</Text>
                    </View>
                  </DataTable.Cell>
                </DataTable.Row>
              ))}

              {remainingUsers.length > itemsPerPage && (
                <View style={styles.paginationContainer}>
                  <DataTable.Pagination
                    page={page}
                    numberOfPages={Math.ceil(remainingUsers.length / itemsPerPage)}
                    onPageChange={(page) => setPage(page)}
                    onItemsPerPageChange={onItemsPerPageChange}
                    showFastPaginationControls
                    style={styles.pagination}
                  />
                </View>
              )}
            </DataTable>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F9FBFC",
    padding: 20,
    marginTop: 20,
    flex: 1,
  },
  topNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: 40,
    marginTop: 50

  },
  heading: {
    fontSize: 20,
    fontWeight: "600",
    fontFamily: "Satoshi",
  },
  subText: {
    fontFamily: "Urbanist",
    fontSize: 14,
    lineHeight: 20,
    color: "#61728C",
    fontWeight: "400",
    marginTop: 10,
  },
  board: {
    marginTop: 70,
  },
  topthree: {
    flexDirection: "row",
    justifyContent: "center",
  },
  first: {
    backgroundColor: "#000",
    borderRadius: 20,
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 10,
    width: 130,
    height: 180, 
    zIndex: 2,
    gap: 8,
  },
  second: {
    backgroundColor: "#EDF3FC",
    borderRadius: 20,
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    width: 110,
    height: 160, 
    zIndex: 1,
    alignSelf: "flex-end",
    gap: 8
  },
  third: {
    backgroundColor: "#F5F3FF",
    borderRadius: 20,
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
    width: 100,
    height: 140, 
    zIndex: 1,
    alignSelf: "flex-end",
    gap: 6,
  },
  medal: {
    position: "absolute",
    top: -25,
    width: 45,
    height: 45,
    zIndex: 3,
  },
  avatarWrapper: {
    backgroundColor: "#fff",
    borderRadius: 999,
    padding: 3,
    marginTop: 5, 
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  name: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 3,
    color: "#2D3C52",
    fontFamily: "Satoshi",
    textAlign: "center",
  },
  level: {
    fontSize: 10,
    fontFamily: "Satoshi",
    fontWeight: "500",
    marginTop: 1,
    textAlign: "center",
  },
  xpContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2
  },
  badgeIcon: {
    width: 10,
    height: 10,
    marginRight: 3,
  },
  xp: {
    fontSize: 10,
    fontWeight: "500",
    color: "#61728C",
    fontFamily: "Satoshi",
    lineHeight: 12
  },
  tableContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    marginTop: 20,
  },
  tableTitle: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Satoshi",
    marginBottom: 10,
    marginLeft: 5,
  },
  table: {
    backgroundColor: '#fff',
  },
  tableHeader: {
    backgroundColor: '#F9FBFC',
  },
  tableRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#EDF3FC',
    fontFamily: "Satoshi",
    paddingVertical: 8,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rankColumn: {
    flex: 0.15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameColumn: {
    flex: 0.5,
    justifyContent: 'center',
  },
  xpColumn: {
    flex: 0.35,
    justifyContent: 'center',
  },
  xpColumnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 5,
  },
  tableIcon: {
    width: 14,
    height: 14,
  },
  pagination: {
    paddingHorizontal: 0,
  },
  paginationContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  rankText: {
    fontFamily: "Satoshi",
    textAlign: 'center',
  },
  nameText: {
    fontFamily: "Satoshi",
  },
  xpText: {
    fontFamily: "Satoshi",
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: "Urbanist",
    fontSize: 16,
    color: "#61728C",
    marginTop: 20,
  },
  errorText: {
    fontFamily: "Urbanist",
    fontSize: 16,
    color: "#FF6B6B",
    textAlign: 'center',
    marginTop: 100,
  },
});

export default Leaderboard;
