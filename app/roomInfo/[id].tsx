import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native'
import React, { useState, useEffect } from 'react'
import BackButton from '@/components/backButton'
import { Image } from 'expo-image'
import * as Clipboard from 'expo-clipboard'
import useUserStore from '@/core/userState'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import Modal from 'react-native-modal'
import { useLocalSearchParams } from 'expo-router'
import { CommunityService } from '@/services/community.service'
import type { Community, CommunityMember, CommunityJoinRequest, CommunityMod } from '@/interface/Community'
import * as Haptics from 'expo-haptics'

const communityService = new CommunityService()

const RoomInfo = () => {
  const { theme } = useUserStore()
  const user = useUserStore(s => s.user)
  const { id } = useLocalSearchParams<{ id: string }>()
  
  const [activeTab, setActiveTab] = useState<'members' | 'pending'>('members')
  const [selectedMember, setSelectedMember] = useState<CommunityMember | null>(null)
  const [showMemberModal, setShowMemberModal] = useState(false)
  
  const [community, setCommunity] = useState<Community | null>(null)
  const [moderator, setModerator] = useState<CommunityMod | null>(null)
  const [members, setMembers] = useState<CommunityMember[]>([])
  const [pendingRequests, setPendingRequests] = useState<CommunityJoinRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMod, setIsMod] = useState(false)

  useEffect(() => {
    if (id && user?.id) {
      loadCommunityInfo()
    }
  }, [id, user?.id])

  const loadCommunityInfo = async () => {
    if (!id || !user?.id) return

    try {
      setIsLoading(true)
      
      const [communityData, membersData, modData] = await Promise.all([
        communityService.getCommunityById(id),
        communityService.getCommunityMembers(id),
        communityService.getCommunityMod(id).catch(() => null)
      ])

      setCommunity(communityData)
      setMembers(membersData)
      setModerator(modData)

      const userIsMod = modData?.user.id === user.id
      console.log('Mod check:', { modUserId: modData?.user.id, currentUserId: user.id, isMod: userIsMod })
      setIsMod(userIsMod)
      
      if (userIsMod) {
        try {
          const requests = await communityService.getPendingJoinRequests(id, user.id)
          setPendingRequests(requests)
        } catch (error) {
          console.error('Error fetching pending requests:', error)
        }
      }
    } catch (error) {
      console.error('Error loading community info:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleMemberClick = (member: CommunityMember) => {
    setSelectedMember(member)
    setShowMemberModal(true)
  }

  const handleAcceptRequest = async (requestId: string) => {
    if (!id || !user?.id) return

    try {
      await communityService.updateJoinRequestStatus(requestId, 'approved', id, user.id)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      loadCommunityInfo()
    } catch (error) {
      console.error('Error accepting request:', error)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    if (!id || !user?.id) return

    try {
      await communityService.updateJoinRequestStatus(requestId, 'rejected', id, user.id)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      loadCommunityInfo()
    } catch (error) {
      console.error('Error rejecting request:', error)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    }
  }

  const handleRemoveMember = async () => {
    if (!id || !selectedMember) return

    try {
      await communityService.removeMember(id, selectedMember.user.id)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setShowMemberModal(false)
      setSelectedMember(null)
      loadCommunityInfo()
    } catch (error) {
      console.error('Error removing member:', error)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    }
  }

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator size="large" color={theme === 'dark' ? '#00FF80' : '#000'} />
        <Text style={[styles.loadingText, theme === 'dark' && { color: '#E0E0E0' }]}>
          Loading community info...
        </Text>
      </View>
    )
  }

  if (!community) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <Text style={[styles.errorText, theme === 'dark' && { color: '#E0E0E0' }]}>
          Community not found
        </Text>
      </View>
    )
  }
  
  return (
    <ScrollView style={[styles.container, theme === "dark" && { backgroundColor: "#0D0D0D" }]}>
        <View style={[styles.topNav, theme === "dark" && { backgroundColor: "#131313" }]}>

          <BackButton />
          <Text style={[styles.headerText, theme === "dark" && { color: "#E0E0E0" }]}>
              Community Info
          </Text>


        </View>
        <View style={styles.content}>
        <View style={[styles.communityCard, theme === "dark" && { backgroundColor: "#131313" }]}>
          <Image 
            source={{uri: community.imageUrl || 'https://s2.coinmarketcap.com/static/img/coins/200x200/5426.png'}} 
            style={styles.communityImage} 
          />
          <View style={styles.communityDetails}>
              <Text style={[styles.communityTitle, theme === "dark" && { color: "#E0E0E0" }]}>
                  {community.title}
              </Text>
              <Text style={[styles.communityStats, theme === "dark" && { color: "#B3B3B3" }]}>
                {members.length} {members.length === 1 ? 'member' : 'members'}
              </Text>
              <Text style={[styles.communityDescription, theme === "dark" && { color: "#B3B3B3" }]}>
                  {community.visibility === 'public' ? '🌐 Public Community' : '🔒 Private Community'}
              </Text>
          </View>
        </View>

        <View style={[styles.inviteCode, theme === "dark" && { backgroundColor: "#131313", borderColor: "#2E3033" }]}>
          <Text style={[styles.inviteSubtitle, theme === "dark" && { color: "#B3B3B3" }]}>
            Share this code to invite others. to the Community
          </Text>

          <View style={[styles.referralCodeContainer, theme === "dark" && { backgroundColor: "#2E3033", borderColor: "#2E3033" }]}>
            <Text style={[styles.referralCode, theme === "dark" && { color: "#E0E0E0" }]}>{community.inviteCode}</Text>
            <TouchableOpacity
              onPress={async () => {
                await Clipboard.setStringAsync(community.inviteCode);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
              }}
              style={{flexDirection: "row", alignItems: "center", gap: 8}}
            >
              <Text style={[styles.copyCodeText, theme === "dark" && { color: "#B3B3B3" }]}>Copy Code</Text>
              <Image
                source={theme === "dark" ? require("@/assets/images/icons/dark/copy.png") : require("@/assets/images/icons/copy.png")}
                style={{ width: 16, height: 16 }}
              />
            </TouchableOpacity>
          </View>
        </View>

        {isMod && (
          <View style={[styles.tabsContainer, theme === 'dark' && { backgroundColor: '#131313' }]}>
            <View style={styles.tabs}>
              <TouchableOpacity onPress={() => setActiveTab('members')} style={styles.tabButton}>
                <Text
                  style={[
                    styles.tabText,
                    activeTab === 'members' && styles.activeTab,
                    theme === 'dark' && styles.darkTabText,
                    activeTab === 'members' && theme === 'dark' && styles.darkActiveTab,
                  ]}
                >
                  Members
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setActiveTab('pending')} style={styles.tabButton}>
                <Text
                  style={[
                    styles.tabText,
                    activeTab === 'pending' && styles.activeTab,
                    theme === 'dark' && styles.darkTabText,
                    activeTab === 'pending' && theme === 'dark' && styles.darkActiveTab,
                  ]}
                >
                  Pending Requests
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        {activeTab === 'members' && (
          <View style={[styles.membersContainer, theme === 'dark' && styles.darkMembersContainer]}>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, theme === 'dark' && { color: '#E0E0E0' }]}>
                Moderators - {moderator ? 1 : 0}
              </Text>
              {moderator && (
                <View style={[styles.memberCard, theme === 'dark' && { backgroundColor: '#131313', borderColor: '#2E3033' }]}>
                  <Image
                    source={require('@/assets/images/memoji.png')}
                    style={styles.memberAvatar}
                  />
                  <Text style={[styles.memberName, theme === 'dark' && { color: '#E0E0E0' }]}>
                    {moderator.user.name}
                  </Text>
                  <View style={styles.modBadge}>
                    <Text style={styles.modBadgeText}>MOD</Text>
                  </View>
                </View>
              )}
            </View>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, theme === 'dark' && { color: '#E0E0E0' }]}>
                Members - {members.length}
              </Text>
              {members.filter(m => m.user.id !== moderator?.user.id).map((member) => (
                <TouchableOpacity 
                  key={member.user.id} 
                  style={[styles.memberCard, theme === 'dark' && { backgroundColor: '#131313', borderColor: '#2E3033' }]}
                  onPress={() => isMod ? handleMemberClick(member) : null}
                >
                  <Image
                    source={require('@/assets/images/memoji.png')}
                    style={styles.memberAvatar}
                  />
                  <Text style={[styles.memberName, theme === 'dark' && { color: '#E0E0E0' }]}>
                    {member.user.name}
                  </Text>
                  {isMod && (
                    <FontAwesome5 name="chevron-right" size={16} color="#61728C" style={styles.chevronIcon} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {isMod && activeTab === 'pending' && (
          <View style={[styles.membersContainer, theme === 'dark' && styles.darkMembersContainer]}>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, theme === 'dark' && { color: '#E0E0E0' }]}>
                Pending Requests - {pendingRequests.length}
              </Text>
              {pendingRequests.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, theme === 'dark' && { color: '#E0E0E0' }]}>
                    No pending requests
                  </Text>
                </View>
              ) : (
                pendingRequests.map((request) => (
                  <View 
                    key={request.id} 
                    style={[styles.pendingCard, theme === 'dark' && { backgroundColor: '#131313', borderColor: '#2E3033' }]}
                  >
                    <Image
                      source={require('@/assets/images/memoji.png')}
                      style={styles.memberAvatar}
                    />
                    <Text style={[styles.memberName, theme === 'dark' && { color: '#E0E0E0' }]}>
                      {request.user.name}
                    </Text>
                    <View style={styles.actionButtons}>
                      <TouchableOpacity 
                        style={styles.acceptButton}
                        onPress={() => handleAcceptRequest(request.id)}
                      >
                        <FontAwesome5 name="check" size={16} color="#00FF80" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.rejectButton}
                        onPress={() => handleRejectRequest(request.id)}
                      >
                        <FontAwesome5 name="times" size={16} color="#FF3B30" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        )}
      </View>

      <Modal
        isVisible={showMemberModal}
        onBackdropPress={() => setShowMemberModal(false)}
        onSwipeComplete={() => setShowMemberModal(false)}
        swipeDirection={['down']}
        style={styles.bottomModal}
      >
        <View style={[styles.modalContent, theme === 'dark' && { backgroundColor: '#131313' }]}>
          <View style={styles.modalHandle} />
          
          <TouchableOpacity 
            style={styles.modalOption}
            onPress={() => {
              setShowMemberModal(false)
              console.log('View profile:', selectedMember)
            }}
          >
            <FontAwesome5 name="user" size={20} color={theme === 'dark' ? '#E0E0E0' : '#2D3C52'} />
            <Text style={[styles.modalOptionText, theme === 'dark' && { color: '#E0E0E0' }]}>
              View Profile
            </Text>
          </TouchableOpacity>

          {isMod && (
            <TouchableOpacity 
              style={styles.modalOption}
              onPress={handleRemoveMember}
            >
              <FontAwesome5 name="user-times" size={20} color="#FF3B30" />
              <Text style={[styles.modalOptionTextDanger]}>
                Remove from Community
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </Modal>
    </ScrollView>
  )
}

export default RoomInfo

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FBFC',
    },
    content: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    topNav: {
        flexDirection: 'row',
        gap: 16,
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 50,
        paddingBottom: 16,
        backgroundColor: '#FFFFFF',
        marginBottom: 16,
    },
    headerText: {
        color: "#2D3C52",
        fontFamily: 'Satoshi',
        fontSize: 20,
        lineHeight: 24,
        fontWeight: '500',
    },
    communityCard: {
        backgroundColor: '#FFFFFF',
        flexDirection: 'column',
        alignItems: "flex-start",
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 12,
        borderRadius: 12,
        justifyContent: "center"

    },
    communityImage: {
        width: 100,
        height: 100,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#EDF3FC',
    },
    communityDetails: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 4,
    },
    communityTitle: {
        fontFamily: 'Satoshi',
        fontSize: 18,
        lineHeight: 24,
        fontWeight: '500',
    },
    communityStats: {
        fontFamily: 'Satoshi',
        fontSize: 12,
        lineHeight: 16,
        fontWeight: '400',
        color: '#61728C',
    },
    communityDescription: {
        fontFamily: 'Satoshi',
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '400',
        color: '#61728C',
    },
    inviteCode: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#EDF3FC',
        borderRadius: 24,
        gap: 16,
        padding: 16,
        flexDirection: 'column',
        marginTop: 20,
    },
    inviteSubtitle: {
        fontFamily: 'Satoshi',
        fontSize: 14,
        fontWeight: '400',
        color: '#61728C',
        lineHeight: 18,
    },
    referralCodeContainer: {
        borderRadius: 16,
        borderWidth: 0.5,
        borderColor: '#EDF3FC',
        backgroundColor: '#F9FBFC',
        gap: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 8,
        paddingRight: 12,
        paddingBottom: 8,
        paddingLeft: 24,
    },
    referralCode: {
        color: '#2D3C52',
        fontFamily: 'Satoshi',
        fontSize: 16,
        fontWeight: '500',
    },
    copyCodeText: {
        color: '#2D3C52',
        fontFamily: 'Urbanist',
        fontSize: 16,
        lineHeight: 26,
    },
    tabsContainer: {
        marginTop: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: 16,
    },
    tabs: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#EDF3FC',
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
    },
    tabText: {
        fontFamily: 'Satoshi',
        fontSize: 16,
        fontWeight: '500',
        color: '#61728C',
        paddingBottom: 8,
    },
    activeTab: {
        color: '#000',
        fontWeight: '700',
        borderBottomWidth: 2,
        borderBottomColor: '#000',
    },
    darkTabText: {
        color: '#B3B3B3',
    },
    darkActiveTab: {
        color: '#00FF80',
        borderBottomColor: '#00FF80',
    },
    membersContainer: {
        backgroundColor: '#FFFFFF',
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    darkMembersContainer: {
        backgroundColor: '#131313',
    },
    section: {
        marginTop: 20,
    },
    sectionTitle: {
        fontFamily: 'Satoshi',
        fontSize: 16,
        fontWeight: '600',
        color: '#2D3C52',
        marginBottom: 12,
    },
    memberCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#EDF3FC',
    },
    memberAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    memberName: {
        fontFamily: 'Satoshi',
        fontSize: 14,
        fontWeight: '500',
        color: '#2D3C52',
        flex: 1,
    },
    verifiedIcon: {
        width: 16,
        height: 16,
        marginLeft: 4,
    },
    modBadge: {
        backgroundColor: '#000',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        marginLeft: 8,
    },
    modBadgeText: {
        color: '#00FF80',
        fontFamily: 'Satoshi',
        fontSize: 12,
        fontWeight: '700',
    },
    chevronIcon: {
        marginLeft: 8,
    },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontFamily: 'Satoshi',
    fontSize: 16,
    fontWeight: '500',
    color: '#2D3C52',
    marginTop: 12,
  },
  errorText: {
    fontFamily: 'Satoshi',
    fontSize: 16,
    fontWeight: '500',
    color: '#FF3B30',
    textAlign: 'center',
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Satoshi',
    fontSize: 14,
    fontWeight: '500',
    color: '#61728C',
    textAlign: 'center',
  },
  pendingCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#EDF3FC',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
        marginLeft: 8,
    },
    acceptButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0, 255, 128, 0.1)',
        borderWidth: 1,
        borderColor: '#00FF80',
        justifyContent: 'center',
        alignItems: 'center',
    },
    rejectButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 59, 48, 0.1)',
        borderWidth: 1,
        borderColor: '#FF3B30',
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomModal: {
        justifyContent: 'flex-end',
        margin: 0,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 8,
        paddingBottom: 40,
        paddingHorizontal: 20,
    },
    modalHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#E0E0E0',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        gap: 16,
    },
    modalOptionText: {
        fontFamily: 'Satoshi',
        fontSize: 16,
        fontWeight: '500',
        color: '#2D3C52',
    },
    modalOptionTextDanger: {
        fontFamily: 'Satoshi',
        fontSize: 16,
        fontWeight: '500',
        color: '#FF3B30',
    },
})
