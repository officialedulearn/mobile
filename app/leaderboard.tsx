import BackButton from "@/components/backButton";
import React, { useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { DataTable } from "react-native-paper";

const Leaderboard = () => {

  const [page, setPage] = useState<number>(0);
  const [numberOfItemsPerPageList] = useState([5, 10, 15]);
  const [itemsPerPage, onItemsPerPageChange] = useState(
    numberOfItemsPerPageList[0]
  );

  const [users] = useState([
    {
      key: 1,
      rank: 4,
      name: "John Smith",
      xp: 240,
    },
    {
      key: 2,
      rank: 5,
      name: "Emily Johnson",
      xp: 235,
    },
    {
      key: 3,
      rank: 6,
      name: "Michael Brown",
      xp: 228,
    },
    {
      key: 4,
      rank: 7,
      name: "Jessica Williams",
      xp: 215,
    },
    {
      key: 5,
      rank: 8,
      name: "David Jones",
      xp: 210,
    },
    {
      key: 6,
      rank: 9,
      name: "Sarah Miller",
      xp: 198,
    },
    {
      key: 7,
      rank: 10,
      name: "Robert Davis",
      xp: 195,
    },
    {
      key: 8,
      rank: 11,
      name: "Jennifer Garcia",
      xp: 185,
    },
    {
      key: 9,
      rank: 12,
      name: "Thomas Rodriguez",
      xp: 180,
    },
    {
      key: 10,
      rank: 13,
      name: "Lisa Martinez",
      xp: 175,
    },
    {
      key: 11,
      rank: 14,
      name: "Daniel Wilson",
      xp: 165,
    },
    {
      key: 12,
      rank: 15,
      name: "Patricia Anderson",
      xp: 155,
    },
  ]);

  const from = page * itemsPerPage;
  const to = Math.min((page + 1) * itemsPerPage, users.length);

  useEffect(() => {
    setPage(0);
  }, [itemsPerPage]);

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
          <View style={styles.second}>
            <Image source={require("@/assets/images/silver.png")} style={styles.medal} />
            <View style={styles.avatarWrapper}>
              <Image source={require("@/assets/images/memoji.png")} style={styles.avatar} />
            </View>
            <Text style={styles.name}>Ahmed Abiola</Text>
            <Text style={[styles.level, { color: "#61728C" }]}>Intermediate</Text>
            <View style={styles.xpContainer}>
              <Image source={require("@/assets/images/icons/medal-05.png")} style={styles.badgeIcon} />
              <Text style={styles.xp}>247 XP</Text>
            </View>
          </View>
          <View style={styles.first}>
            <Image source={require("@/assets/images/gold.png")} style={styles.medal} />
            <View style={styles.avatarWrapper}>
              <Image source={require("@/assets/images/memoji.png")} style={styles.avatar} />
            </View>
            <Text style={[styles.name, { color: "#00FF66" }]}>Ahmed Abiola</Text>
            <Text style={[styles.level, { color: "#00FF66" }]}>Advanced</Text>
            <View style={styles.xpContainer}>
              <Image source={require("@/assets/images/icons/medal-05.png")} style={styles.badgeIcon} />
              <Text style={[styles.xp, { color: "#00FF66" }]}>247 XP</Text>
            </View>
          </View>

          <View style={styles.third}>
            <Image source={require("@/assets/images/bronze.png")} style={styles.medal} />
            <View style={styles.avatarWrapper}>
              <Image source={require("@/assets/images/memoji.png")} style={styles.avatar} />
            </View>
            <Text style={styles.name}>Ahmed Abiola</Text>
            <Text style={[styles.level, { color: "#A78BFA" }]}>Beginner</Text>
            <View style={styles.xpContainer}>
              <Image source={require("@/assets/images/icons/medal-05.png")} style={styles.badgeIcon} />
              <Text style={styles.xp}>247 XP</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.tableContainer}>
          <DataTable style={styles.table}>
            {users.slice(from, to).map((user) => (
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

            <View style={styles.paginationContainer}>
              <DataTable.Pagination
                page={page}
                numberOfPages={Math.ceil(users.length / itemsPerPage)}
                onPageChange={(page) => setPage(page)}
                onItemsPerPageChange={onItemsPerPageChange}
                showFastPaginationControls
                style={styles.pagination}
              />
            </View>
          </DataTable>
        </View>
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
    paddingVertical: 20,
    paddingHorizontal: 12,
    width: 170,
    height: 230, 
    zIndex: 2,
    gap: 10,
  },
  second: {
    backgroundColor: "#EDF3FC",
    borderRadius: 20,
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    width: 140,
    height: 200, 
    zIndex: 1,
    alignSelf: "flex-end",
    gap:10
  },
  third: {
    backgroundColor: "#F5F3FF",
    borderRadius: 20,
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    width: 130,
    height: 180, 
    zIndex: 1,
    alignSelf: "flex-end",
    gap: 10,
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
    padding: 5,
    marginTop: 5, 
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 5, // Reduced margin
    color: "#2D3C52",
    fontFamily: "Satoshi",
  },
  level: {
    fontSize: 12,
    fontFamily: "Satoshi",
    fontWeight: "500",
    marginTop: 1
  },
  xpContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3
  },
  badgeIcon: {
    width: 12,
    height: 12,
    marginRight: 4,
  },
  xp: {
    fontSize: 12,
    fontWeight: "500",
    color: "#61728C",
    fontFamily: "Satoshi",
    lineHeight: 15
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
});


export default Leaderboard;
