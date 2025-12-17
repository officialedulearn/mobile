import { StyleSheet, Text, TouchableOpacity, View, Image, ActivityIndicator, ScrollView } from 'react-native'
import React, { useState, useEffect } from 'react'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import useUserStore from '@/core/userState'
import { router } from 'expo-router'
import { CommunityService } from '@/services/community.service'
import type { UserCommunity } from '@/interface/Community'

type Props = {}

const communityService = new CommunityService()

const Hub = (props: Props) => {
  const [activeTab, setActiveTab] = useState<'communities' | 'trending'>('communities')
  const theme = useUserStore(s => s.theme)
  const user = useUserStore(s => s.user)
  const [communities, setCommunities] = useState<UserCommunity[]>([])
  const [communityDetails, setCommunityDetails] = useState<{ [key: string]: { memberCount: number; description?: string } }>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id) {
      fetchCommunities()
    }
  }, [user?.id])

  const fetchCommunities = async () => {
    if (!user?.id) return
    
    try {
      setIsLoading(true)
      setError(null)
      const data = await communityService.getUserCommunities(user.id)
      setCommunities(data)
      
      const details: { [key: string]: { memberCount: number; description?: string } } = {}
      await Promise.all(
        data.map(async (community) => {
          try {
            const countData = await communityService.getMemberCount(community.id)
            details[community.id] = { 
              memberCount: countData.count,
              description: `Join ${community.title} to connect with like-minded learners`
            }
          } catch (err) {
            console.error(`Error fetching details for ${community.id}:`, err)
            details[community.id] = { memberCount: 0, description: 'Join this community' }
          }
        })
      )
      setCommunityDetails(details)
    } catch (err) {
      console.error('Error fetching communities:', err)
      setError('Failed to load communities')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <View style={[styles.container, theme === 'dark' && styles.darkContainer]}>
      <View style={styles.headerNav}>
        <Text style={[styles.headerTitle, theme === 'dark' && styles.darkHeaderTitle]}>Communities</Text>
      </View>

      <View style={styles.tabsContainer}>
        <View style={styles.tabs}>
          <TouchableOpacity onPress={() => setActiveTab('communities')}>
            <Text
              style={[
                styles.tabText,
                activeTab === 'communities' && styles.activeTab,
                theme === 'dark' && styles.darkTabText,
                activeTab === 'communities' && theme === 'dark' && styles.darkActiveTab,
              ]}
            >
              Communities
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setActiveTab('trending')}>
            <View style={styles.tabLabel}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'trending' && styles.activeTab,
                  theme === 'dark' && styles.darkTabText,
                  activeTab === 'trending' && theme === 'dark' && styles.darkActiveTab,
                ]}
              >
                Trending
              </Text>
              <FontAwesome5 name="fire" size={14} color="#FF3B30" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.communitiesScrollView}
        contentContainerStyle={styles.communitiesContainer}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme === 'dark' ? '#00FF80' : '#000'} />
            <Text style={[styles.loadingText, theme === 'dark' && styles.darkText]}>
              Loading communities...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={[styles.errorText, theme === 'dark' && styles.darkText]}>
              {error}
            </Text>
            <TouchableOpacity onPress={fetchCommunities} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : communities.length === 0 ? (
          <View style={styles.centerContainer}>
            <FontAwesome5 name="users" size={48} color={theme === 'dark' ? '#B0B0B0' : '#61728C'} />
            <Text style={[styles.emptyText, theme === 'dark' && styles.darkText]}>
              No communities yet
            </Text>
            <Text style={[styles.emptySubtext, theme === 'dark' && styles.darkTextSecondary]}>
              Join a community to get started
            </Text>
          </View>
        ) : (
          communities.map((community) => (
            <TouchableOpacity 
              key={community.id}
              onPress={() => router.push({ pathname: '/room/[id]', params: { id: community.id } })}
            >
              <View style={[styles.communityCard, theme === 'dark' && styles.darkCommunityCard]}>
                <Image 
                  source={{
                    uri: community.imageUrl || 'https://s2.coinmarketcap.com/static/img/coins/200x200/5426.png'
                  }} 
                  style={styles.communityCardImage} 
                />

                <View style={styles.communityCardContent}>
                  <Text style={[styles.communityCardTitle, theme === 'dark' && styles.darkText]}>
                    {community.title}
                  </Text>
                  <Text style={[styles.communityLastMessage, theme === 'dark' && styles.darkTextSecondary]}>
                    {communityDetails[community.id]?.description || 'Join this community'}
                  </Text>
                  <Text style={[styles.communityLastMessage, theme === 'dark' && styles.darkTextSecondary]}>
                    {communityDetails[community.id]?.memberCount !== undefined
                      ? `${communityDetails[community.id].memberCount} members`
                      : 'Loading members...'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <TouchableOpacity 
        style={[styles.joinButton, theme === 'dark' && styles.darkJoinButton]}
        activeOpacity={0.8}
        onPress={() => router.push('/joinCommunity')  }
      >
        <Text style={styles.joinButtonText}>Join Community</Text>
        <FontAwesome5 name="plus" size={20} color="#00FF80" />
      </TouchableOpacity>
    </View>
  )
}

export default Hub

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  headerNav: {
    marginTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  headerTitle: {
    color: '#2D3C52',
    fontSize: 20,
    lineHeight: 24,
    fontFamily: 'Satoshi',
  },
  darkHeaderTitle: {
    color: '#FFFFFF',
    fontFamily: 'Satoshi',
  },
  tabsContainer: {
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingVertical: 24,
  },
  tabLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeTab: {
    color: '#000',
    fontWeight: '700',
    borderBottomWidth: 2,
    borderBottomColor: '#000',
    fontFamily: 'Satoshi',
  },
  darkActiveTab: {
    color: '#FFFFFF',
    borderBottomColor: '#FFFFFF',
    fontFamily: 'Satoshi',
  },
  tabText: {
    textAlign: 'center',
    fontFamily: 'Satoshi',
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
    color: '#61728C',
    paddingBottom: 8,
  },
  darkTabText: {
    color: '#FFFFFF',
    fontFamily: 'Satoshi',
  },
  communitiesContainer: {
    flexDirection: 'row',
    marginTop: 10,
    gap:10,
    flexWrap: 'wrap',
  },
  communityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 24,
    borderWidth: 1,
    borderColor: '#EDF3FC',
    flexDirection: 'row',
    alignItems: 'center',
  },
  communityCardImage: {
    width: 100,
    height: 100,
    borderRadius: 10, 
  },
  communityCardContent: {
    flexDirection: 'column',
    gap: 4,
  },
  communityCardTitle: {
    fontFamily: 'Satoshi',
    fontSize: 16,
    fontWeight: '600',
  },
  communityLastMessage: {
    fontFamily: 'Satoshi',
    fontSize: 14,
    fontWeight: '400',
    color: '#61728C',
  },
  darkCommunityCard: {
    backgroundColor: '#1E1E1E',
    borderColor: '#2E3033',
  },
  darkText: {
    color: '#FFFFFF',
  },
  darkTextSecondary: {
    color: '#B0B0B0',
  },
  communitiesScrollView: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    gap: 16,
  },
  loadingText: {
    fontFamily: 'Satoshi',
    fontSize: 16,
    fontWeight: '500',
    color: '#2D3C52',
  },
  errorText: {
    fontFamily: 'Satoshi',
    fontSize: 16,
    fontWeight: '500',
    color: '#FF3B30',
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: '#000',
    borderRadius: 16,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#00FF80',
    fontFamily: 'Satoshi',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    fontFamily: 'Satoshi',
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3C52',
  },
  emptySubtext: {
    fontFamily: 'Satoshi',
    fontSize: 14,
    fontWeight: '400',
    color: '#61728C',
    textAlign: 'center',
  },
  communityCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  communityVisibility: {
    fontFamily: 'Satoshi',
    fontSize: 12,
    fontWeight: '400',
    color: '#61728C',
  },
  modBadge: {
    backgroundColor: '#000',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  modBadgeText: {
    color: '#00FF80',
    fontFamily: 'Satoshi',
    fontSize: 10,
    fontWeight: '700',
  },
  joinButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#00FF80',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.15,
    shadowRadius: 25,
    elevation: 12,
    height: 48,
  },
  darkJoinButton: {
    backgroundColor: '#0A84FF',
  },
  joinButtonText: {
    color: '#00FF80',
    fontFamily: 'Satoshi',
    fontSize: 16,
    fontWeight: '600',
  },
})
