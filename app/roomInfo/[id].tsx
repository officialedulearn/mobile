import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import BackButton from "@/components/common/backButton";
import { Image } from "expo-image";
import * as Clipboard from "expo-clipboard";
import useUserStore from "@/core/userState";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Modal from "react-native-modal";
import { useLocalSearchParams } from "expo-router";
import { CommunityService } from "@/services/community.service";
import useCommunityStore from "@/core/communityState";
import type {
  Community,
  CommunityMember,
  CommunityJoinRequest,
  CommunityMod,
} from "@/interface/Community";
import * as Haptics from "expo-haptics";
import { FlashList } from "@shopify/flash-list";

const communityService = new CommunityService();

type MemberRow =
  | { key: string; type: "section"; title: string }
  | { key: string; type: "moderator"; mod: CommunityMod }
  | { key: string; type: "member"; member: CommunityMember };

type PendingRow = { key: string; type: "pending"; request: CommunityJoinRequest };

const RoomInfo = () => {
  const { theme } = useUserStore();
  const user = useUserStore((s) => s.user);
  const { id } = useLocalSearchParams<{ id: string }>();
  const fetchCommunityById = useCommunityStore((s) => s.fetchCommunityById);
  const mergeCommunity = useCommunityStore((s) => s.mergeCommunity);
  const setRoomInfoCache = useCommunityStore((s) => s.setRoomInfoCache);

  const communityId = Array.isArray(id) ? id[0] : id;

  const getHighQualityImageUrl = (url: string | null | undefined): string | undefined => {
    if (!url || typeof url !== "string") return undefined;
    return url
      .replace(/_normal(\.[a-z]+)$/i, "_400x400$1")
      .replace(/_mini(\.[a-z]+)$/i, "_400x400$1")
      .replace(/_bigger(\.[a-z]+)$/i, "_400x400$1");
  };

  const [activeTab, setActiveTab] = useState<"members" | "pending">("members");
  const [selectedMember, setSelectedMember] = useState<CommunityMember | null>(null);
  const [showMemberModal, setShowMemberModal] = useState(false);

  const [community, setCommunity] = useState<Community | null>(null);
  const [moderator, setModerator] = useState<CommunityMod | null>(null);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [pendingRequests, setPendingRequests] = useState<CommunityJoinRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMod, setIsMod] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadCommunityInfo = useCallback(
    async (options?: { force?: boolean }) => {
      if (!communityId || !user?.id) return;
      const cached = useCommunityStore.getState().roomInfoByCommunityId[communityId];
      if (cached && !options?.force) {
        return;
      }

      try {
        if (!cached) {
          setIsLoading(true);
        }

        const cachedCommunity = useCommunityStore.getState().communityById[communityId];
        const communityData = cachedCommunity ?? (await fetchCommunityById(communityId));
        setCommunity(communityData ?? null);
        if (communityData) mergeCommunity(communityData);

        const [membersData, modData] = await Promise.all([
          communityService.getCommunityMembers(communityId),
          communityService.getCommunityMod(communityId).catch(() => null),
        ]);

        setMembers(membersData);
        setModerator(modData);

        const userIsMod = modData?.user.id === user.id;
        setIsMod(userIsMod);

        let requests: CommunityJoinRequest[] = [];
        if (userIsMod) {
          try {
            requests = await communityService.getPendingJoinRequests(communityId, user.id);
            setPendingRequests(requests);
          } catch (error) {
            console.error("Error fetching pending requests:", error);
          }
        } else {
          setPendingRequests([]);
        }

        setRoomInfoCache(communityId, {
          members: membersData,
          moderator: modData,
          pendingRequests: requests,
          isMod: userIsMod,
        });
      } catch (error) {
        console.error("Error loading community info:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [communityId, user?.id, fetchCommunityById, mergeCommunity, setRoomInfoCache],
  );

  useEffect(() => {
    if (!communityId || !user?.id) return;
    const cached = useCommunityStore.getState().roomInfoByCommunityId[communityId];
    const comm = useCommunityStore.getState().communityById[communityId];
    if (cached) {
      setMembers(cached.members);
      setModerator(cached.moderator);
      setPendingRequests(cached.pendingRequests);
      setIsMod(cached.isMod);
      if (comm) {
        setCommunity(comm);
      } else {
        fetchCommunityById(communityId).then((data) => {
          if (data) {
            setCommunity(data);
            mergeCommunity(data);
          }
        });
      }
      setIsLoading(false);
      return;
    }
    void loadCommunityInfo();
  }, [communityId, user?.id, loadCommunityInfo, fetchCommunityById, mergeCommunity]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadCommunityInfo({ force: true });
    } finally {
      setRefreshing(false);
    }
  }, [loadCommunityInfo]);

  const handleMemberClick = useCallback((member: CommunityMember) => {
    setSelectedMember(member);
    setShowMemberModal(true);
  }, []);

  const handleAcceptRequest = async (requestId: string) => {
    if (!communityId || !user?.id) return;

    try {
      await communityService.updateJoinRequestStatus(requestId, "approved", communityId, user.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await loadCommunityInfo({ force: true });
    } catch (error) {
      console.error("Error accepting request:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (!communityId || !user?.id) return;

    try {
      await communityService.updateJoinRequestStatus(requestId, "rejected", communityId, user.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await loadCommunityInfo({ force: true });
    } catch (error) {
      console.error("Error rejecting request:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleRemoveMember = async () => {
    if (!communityId || !selectedMember) return;

    try {
      await communityService.removeMember(communityId, selectedMember.user.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowMemberModal(false);
      setSelectedMember(null);
      await loadCommunityInfo({ force: true });
    } catch (error) {
      console.error("Error removing member:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const memberRows: MemberRow[] = useMemo(() => {
    const rows: MemberRow[] = [];
    rows.push({
      key: "sec-mod",
      type: "section",
      title: `Moderators - ${moderator ? 1 : 0}`,
    });
    if (moderator) {
      rows.push({ key: `mod-${moderator.user.id}`, type: "moderator", mod: moderator });
    }
    rows.push({
      key: "sec-mem",
      type: "section",
      title: `Members - ${members.length}`,
    });
    for (const m of members.filter((mem) => mem.user.id !== moderator?.user.id)) {
      rows.push({ key: `mem-${m.user.id}`, type: "member", member: m });
    }
    return rows;
  }, [moderator, members]);

  const pendingRows: PendingRow[] = useMemo(
    () => pendingRequests.map((r) => ({ key: r.id, type: "pending" as const, request: r })),
    [pendingRequests],
  );

  const listData = activeTab === "members" ? memberRows : pendingRows;

  const renderMemberRow = useCallback(
    ({ item }: { item: MemberRow }) => {
      if (item.type === "section") {
        return (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, theme === "dark" && styles.darkSectionTitle]}>{item.title}</Text>
          </View>
        );
      }
      if (item.type === "moderator") {
        return (
          <View
            style={[styles.memberCard, theme === "dark" && { backgroundColor: "#131313", borderColor: "#2E3033" }]}
          >
            <Image
              source={
                getHighQualityImageUrl(item.mod.user.profilePictureURL)
                  ? { uri: getHighQualityImageUrl(item.mod.user.profilePictureURL) }
                  : require("@/assets/images/memoji.png")
              }
              style={styles.memberAvatar}
            />
            <Text style={[styles.memberName, theme === "dark" && { color: "#E0E0E0" }]}>{item.mod.user.name}</Text>
            <View style={[styles.modBadge, theme === "dark" && styles.darkModBadge]}>
              <Text style={[styles.modBadgeText, theme === "dark" && styles.darkModBadgeText]}>MOD</Text>
            </View>
          </View>
        );
      }
      return (
        <TouchableOpacity
          style={[styles.memberCard, theme === "dark" && { backgroundColor: "#131313", borderColor: "#2E3033" }]}
          onPress={() => (isMod ? handleMemberClick(item.member) : null)}
        >
          <Image source={require("@/assets/images/memoji.png")} style={styles.memberAvatar} />
          <Text style={[styles.memberName, theme === "dark" && { color: "#E0E0E0" }]}>{item.member.user.name}</Text>
          {isMod && (
            <FontAwesome5
              name="chevron-right"
              size={16}
              color={theme === "dark" ? "#b3b3b3" : "#61728C"}
              style={styles.chevronIcon}
            />
          )}
        </TouchableOpacity>
      );
    },
    [theme, isMod, getHighQualityImageUrl, handleMemberClick],
  );

  const renderPendingRow = useCallback(
    ({ item }: { item: PendingRow }) => (
      <View style={[styles.pendingCard, theme === "dark" && { backgroundColor: "#131313", borderColor: "#2E3033" }]}>
        <Image source={require("@/assets/images/memoji.png")} style={styles.memberAvatar} />
        <Text style={[styles.memberName, theme === "dark" && { color: "#E0E0E0" }]}>{item.request.user.name}</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.acceptButton} onPress={() => handleAcceptRequest(item.request.id)}>
            <FontAwesome5 name="check" size={16} color="#00FF80" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.rejectButton} onPress={() => handleRejectRequest(item.request.id)}>
            <FontAwesome5 name="times" size={16} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>
    ),
    [theme, handleAcceptRequest, handleRejectRequest],
  );

  const renderItem = useCallback(
    ({ item }: { item: MemberRow | PendingRow }) => {
      if (activeTab === "members") {
        return renderMemberRow({ item: item as MemberRow });
      }
      return renderPendingRow({ item: item as PendingRow });
    },
    [activeTab, renderMemberRow, renderPendingRow],
  );

  const ListHeader = useMemo(
    () =>
      !community ? null : (
        <View style={styles.content}>
          <View style={[styles.communityCard, theme === "dark" && { backgroundColor: "#131313" }]}>
            <Image
              source={{
                uri: community.imageUrl || "https://s2.coinmarketcap.com/static/img/coins/200x200/5426.png",
              }}
              style={styles.communityImage}
            />
            <View style={styles.communityDetails}>
              <Text style={[styles.communityTitle, theme === "dark" && { color: "#E0E0E0" }]}>{community.title}</Text>
              <Text style={[styles.communityStats, theme === "dark" && { color: "#B3B3B3" }]}>
                {members.length} {members.length === 1 ? "member" : "members"}
              </Text>
              <Text style={[styles.communityDescription, theme === "dark" && { color: "#B3B3B3" }]}>
                {community.visibility === "public" ? "🌐 Public Community" : "🔒 Private Community"}
              </Text>
            </View>
          </View>

          <View
            style={[styles.inviteCode, theme === "dark" && { backgroundColor: "#131313", borderColor: "#2E3033" }]}
          >
            <Text style={[styles.inviteSubtitle, theme === "dark" && { color: "#B3B3B3" }]}>
              Share this code to invite others. to the Community
            </Text>

            <View style={[styles.referralCodeContainer, theme === "dark" && styles.darkReferralCodeContainer]}>
              <Text style={[styles.referralCode, theme === "dark" && { color: "#E0E0E0" }]}>{community.inviteCode}</Text>
              <TouchableOpacity
                onPress={async () => {
                  await Clipboard.setStringAsync(community.inviteCode);
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }}
                style={[styles.copyCodeButton, theme === "dark" && styles.darkCopyCodeButton]}
              >
                <Text style={[styles.copyCodeText, theme === "dark" && styles.darkCopyCodeText]}>Copy Code</Text>
                <Image
                  source={
                    theme === "dark"
                      ? require("@/assets/images/icons/dark/copy.png")
                      : require("@/assets/images/icons/copy.png")
                  }
                  style={{ width: 16, height: 16 }}
                />
              </TouchableOpacity>
            </View>
          </View>

          {isMod && (
            <View style={[styles.tabsContainer, theme === "dark" && { backgroundColor: "#131313" }]}>
              <View style={[styles.tabs, theme === "dark" && styles.darkTabBorder]}>
                <TouchableOpacity onPress={() => setActiveTab("members")} style={styles.tabButton}>
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === "members" && styles.activeTab,
                      theme === "dark" && styles.darkTabText,
                      activeTab === "members" && theme === "dark" && styles.darkActiveTab,
                    ]}
                  >
                    Members
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setActiveTab("pending")} style={styles.tabButton}>
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === "pending" && styles.activeTab,
                      theme === "dark" && styles.darkTabText,
                      activeTab === "pending" && theme === "dark" && styles.darkActiveTab,
                    ]}
                  >
                    Pending Requests
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      ),
    [community, members.length, theme, isMod, activeTab],
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContainer, theme === "dark" && { backgroundColor: "#0D0D0D" }]}>
        <ActivityIndicator size="large" color={theme === "dark" ? "#00FF80" : "#000"} />
        <Text style={[styles.loadingText, theme === "dark" && { color: "#E0E0E0" }]}>Loading community info...</Text>
      </View>
    );
  }

  if (!community) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <Text style={[styles.errorText, theme === "dark" && { color: "#E0E0E0" }]}>Community not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, theme === "dark" && { backgroundColor: "#0D0D0D" }]}>
      <FlashList
        style={{ flex: 1 }}
        data={listData}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
        ListHeaderComponent={
          <View>
            <View style={[styles.topNav, theme === "dark" && { backgroundColor: "#131313" }]}>
              <BackButton />
              <Text style={[styles.headerText, theme === "dark" && { color: "#E0E0E0" }]}>Community Info</Text>
            </View>
            {ListHeader}
          </View>
        }
        contentContainerStyle={styles.flashContent}
        ListEmptyComponent={
          activeTab === "pending" && isMod ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, theme === "dark" && { color: "#E0E0E0" }]}>No pending requests</Text>
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme === "dark" ? "#00FF80" : "#000"}
          />
        }
      />

      <Modal
        isVisible={showMemberModal}
        onBackdropPress={() => setShowMemberModal(false)}
        onSwipeComplete={() => setShowMemberModal(false)}
        swipeDirection={["down"]}
        style={styles.bottomModal}
      >
        <View style={[styles.modalContent, theme === "dark" && { backgroundColor: "#131313" }]}>
          <View style={[styles.modalHandle, theme === "dark" && styles.darkModalHandle]} />

          <TouchableOpacity
            style={styles.modalOption}
            onPress={() => {
              setShowMemberModal(false);
            }}
          >
            <FontAwesome5 name="user" size={20} color={theme === "dark" ? "#E0E0E0" : "#2D3C52"} />
            <Text style={[styles.modalOptionText, theme === "dark" && { color: "#E0E0E0" }]}>View Profile</Text>
          </TouchableOpacity>

          {isMod && (
            <TouchableOpacity style={styles.modalOption} onPress={handleRemoveMember}>
              <FontAwesome5 name="user-times" size={20} color="#FF3B30" />
              <Text style={styles.modalOptionTextDanger}>Remove from Community</Text>
            </TouchableOpacity>
          )}
        </View>
      </Modal>
    </View>
  );
};

export default RoomInfo;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FBFC",
  },
  flashContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  content: {
    paddingHorizontal: 0,
    paddingBottom: 8,
  },
  topNav: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    marginBottom: 16,
  },
  headerText: {
    color: "#2D3C52",
    fontFamily: "Satoshi",
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "500",
  },
  communityCard: {
    backgroundColor: "#FFFFFF",
    flexDirection: "column",
    alignItems: "flex-start",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
    borderRadius: 12,
    justifyContent: "center",
  },
  communityImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  communityDetails: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 4,
  },
  communityTitle: {
    fontFamily: "Satoshi",
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "500",
  },
  communityStats: {
    fontFamily: "Satoshi",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400",
    color: "#61728C",
  },
  communityDescription: {
    fontFamily: "Satoshi",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "400",
    color: "#61728C",
  },
  inviteCode: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#EDF3FC",
    borderRadius: 24,
    gap: 16,
    padding: 16,
    flexDirection: "column",
    marginTop: 20,
  },
  inviteSubtitle: {
    fontFamily: "Satoshi",
    fontSize: 14,
    fontWeight: "400",
    color: "#61728C",
    lineHeight: 18,
  },
  referralCodeContainer: {
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: "#EDF3FC",
    backgroundColor: "#F9FBFC",
    gap: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
    paddingRight: 12,
    paddingBottom: 8,
    paddingLeft: 24,
  },
  darkReferralCodeContainer: {
    backgroundColor: "#0d0d0d",
    borderColor: "#2e3033",
  },
  referralCode: {
    color: "#2D3C52",
    fontFamily: "Satoshi",
    fontSize: 16,
    fontWeight: "500",
  },
  copyCodeText: {
    color: "#2D3C52",
    fontFamily: "Urbanist",
    fontSize: 16,
    lineHeight: 26,
  },
  darkCopyCodeText: {
    color: "#e0e0e0",
  },
  copyCodeButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EDF3FC",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  darkCopyCodeButton: {
    backgroundColor: "#131313",
    borderColor: "#2e3033",
  },
  tabsContainer: {
    marginTop: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  tabs: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EDF3FC",
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
  },
  tabText: {
    fontFamily: "Satoshi",
    fontSize: 16,
    fontWeight: "500",
    color: "#61728C",
    paddingBottom: 8,
  },
  activeTab: {
    color: "#000",
    fontWeight: "700",
    borderBottomWidth: 2,
    borderBottomColor: "#000",
  },
  darkTabText: {
    color: "#B3B3B3",
  },
  darkActiveTab: {
    color: "#00FF80",
    borderBottomColor: "#00FF80",
  },
  darkTabBorder: {
    borderBottomColor: "#2e3033",
  },
  section: {
    marginTop: 12,
  },
  sectionTitle: {
    fontFamily: "Satoshi",
    fontSize: 16,
    fontWeight: "600",
    color: "#2D3C52",
    marginBottom: 12,
  },
  darkSectionTitle: {
    color: "#00FF80",
  },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#EDF3FC",
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  memberName: {
    fontFamily: "Satoshi",
    fontSize: 14,
    fontWeight: "500",
    color: "#2D3C52",
    flex: 1,
  },
  modBadge: {
    backgroundColor: "#000",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  darkModBadge: {
    backgroundColor: "#00FF80",
  },
  modBadgeText: {
    color: "#00FF80",
    fontFamily: "Satoshi",
    fontSize: 12,
    fontWeight: "700",
  },
  darkModBadgeText: {
    color: "#000000",
  },
  chevronIcon: {
    marginLeft: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    fontFamily: "Satoshi",
    fontSize: 16,
    fontWeight: "500",
    color: "#2D3C52",
    marginTop: 12,
  },
  errorText: {
    fontFamily: "Satoshi",
    fontSize: 16,
    fontWeight: "500",
    color: "#FF3B30",
    textAlign: "center",
  },
  emptyContainer: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontFamily: "Satoshi",
    fontSize: 14,
    fontWeight: "500",
    color: "#61728C",
    textAlign: "center",
  },
  pendingCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#EDF3FC",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginLeft: 8,
  },
  acceptButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 255, 128, 0.1)",
    borderWidth: 1,
    borderColor: "#00FF80",
    justifyContent: "center",
    alignItems: "center",
  },
  rejectButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 59, 48, 0.1)",
    borderWidth: 1,
    borderColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
  },
  bottomModal: {
    justifyContent: "flex-end",
    margin: 0,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  darkModalHandle: {
    backgroundColor: "#2e3033",
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    gap: 16,
  },
  modalOptionText: {
    fontFamily: "Satoshi",
    fontSize: 16,
    fontWeight: "500",
    color: "#2D3C52",
  },
  modalOptionTextDanger: {
    fontFamily: "Satoshi",
    fontSize: 16,
    fontWeight: "500",
    color: "#FF3B30",
  },
});
