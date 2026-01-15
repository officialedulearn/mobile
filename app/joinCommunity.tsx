import { StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, Image, ScrollView } from 'react-native'
import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react'
import BackButton from '@/components/backButton'
import { ActivityIndicator } from 'react-native'
import * as Haptics from 'expo-haptics' 
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import { CommunityService } from '@/services/community.service'
import type { Community } from '@/interface/Community'
import useUserStore from '@/core/userState'
import { router } from 'expo-router'

const communityService = new CommunityService()

const joinCommunity = () => {
    const user = useUserStore(s => s.user)
    const theme = useUserStore(s => s.theme)
    const [code, setCode] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const [success, setSuccess] = useState(false)
    const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null)
    const [bottomSheetStep, setBottomSheetStep] = useState<'confirm' | 'processing' | 'success'>('confirm')
    const [publicCommunities, setPublicCommunities] = useState<Community[]>([])
    const [communityDetails, setCommunityDetails] = useState<{ [key: string]: { memberCount: number } }>({})
    const [loadingPublic, setLoadingPublic] = useState(true)
    
    const bottomSheetModalRef = useRef<BottomSheetModal>(null)
    const snapPoints = useMemo(() => ['60%'], [])

    useEffect(() => {
      fetchPublicCommunities()
    }, [])

    const fetchPublicCommunities = async () => {
      try {
        setLoadingPublic(true)
        const data = await communityService.getPublicCommunities()
        setPublicCommunities(data)
        
        const details: { [key: string]: { memberCount: number } } = {}
        await Promise.all(
          data.map(async (community) => {
            try {
              const countData = await communityService.getMemberCount(community.id)
              details[community.id] = { memberCount: countData.count }
            } catch (err) {
              console.error(`Error fetching member count for ${community.id}:`, err)
              details[community.id] = { memberCount: 0 }
            }
          })
        )
        setCommunityDetails(details)
      } catch (err) {
        console.error('Error fetching public communities:', err)
      } finally {
        setLoadingPublic(false)
      }
    }

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.5}
        />
      ),
      []
    )

    const handleOpenBottomSheet = (community: Community) => {
      setSelectedCommunity(community)
      setBottomSheetStep('confirm')
      bottomSheetModalRef.current?.present()
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
    const handleCloseBottomSheet = () => {
      bottomSheetModalRef.current?.dismiss()
      setBottomSheetStep('confirm')
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }

    const confirmJoin = async () => {
        if (!code.trim()) {
            setError(true)
            setErrorMessage('Please enter an invite code')
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
            return
        }

        try {
            setIsLoading(true)
            setError(false)
            setErrorMessage('')

            const foundCommunity = await communityService.getCommunityByInviteCode(code)
            
            setSelectedCommunity(foundCommunity)
            setSuccess(true)
            bottomSheetModalRef.current?.present()
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
            setCode('')
        } catch (err: any) {
            console.error('Error finding community:', err)
            setError(true)
            setErrorMessage(err?.response?.data?.message || 'Invalid invite code')
            setSuccess(false)
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleJoinRequest = async () => {
        if (!selectedCommunity || !user?.id) return

        try {
            setBottomSheetStep('processing')
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
            
            await communityService.createJoinRequest(selectedCommunity.id, user.id)
            
            setBottomSheetStep('success')
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        } catch (err: any) {
            console.error('Error requesting to join:', err)
            handleCloseBottomSheet()
            setError(true)
            setErrorMessage(err?.response?.data?.message || 'Failed to send join request')
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        }
    }

  return (
    <>
      <ScrollView style={[styles.container, theme === 'dark' && styles.darkContainer]} showsVerticalScrollIndicator={false}>
      <View style={styles.topNav}>
        <BackButton />
        <Text style={[styles.headerTitle, theme === 'dark' && styles.darkText]}>Join Community</Text>
        
      </View>
      <View style={styles.joinCommunity}>
        <Text style={[styles.joinCommunityTitle, theme === 'dark' && styles.darkSecondaryText]}>Connect with groups that match your learning interests.</Text>
        <View style={styles.inviteContainer}>
          <Text style={[styles.inviteTitle, theme === 'dark' && styles.darkSecondaryText]}>Community Invite Code</Text>

              <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, error && { borderColor: '#FF0000' }, theme === 'dark' && styles.darkInput]}
                placeholder={error ? errorMessage : 'Enter Invite Code'}
                placeholderTextColor={error ? '#FF0000' : (theme === 'dark' ? '#E0E0E0' : 'rgba(45, 60, 82, 0.5)')}
                value={code}
                onChangeText={(text) => {
                  setCode(text)
                  setError(false)
                  setErrorMessage('')
                }}
                keyboardType="default"
                autoCapitalize="characters"
                onSubmitEditing={confirmJoin}
              />
              <TouchableOpacity 
                style={[styles.button, theme === 'dark' && styles.darkButton]} 
                onPress={confirmJoin}
                disabled={isLoading}
              >
                  {isLoading ? <ActivityIndicator size="small" color="#000" /> : <Text style={[styles.buttonText, theme === 'dark' && styles.darkButtonText]}>Join</Text>}
              </TouchableOpacity>
              </View>
              {error && errorMessage && (
                <Text style={styles.errorText}>
                  {errorMessage}
                </Text>
              )}
        </View>
      </View>

      <View style={styles.otherCommunities}>
        <View style={styles.dividerContainer}>
          <View style={[styles.dividerLine, theme === 'dark' && styles.darkDivider]} />
          <Text style={[styles.otherCommunitiesTitle, theme === 'dark' && styles.darkSecondaryText]}>Or Explore</Text>
          <View style={[styles.dividerLine, theme === 'dark' && styles.darkDivider]} />
        </View>

        <Text style={[styles.otherCommunitiesDescription, theme === 'dark' && styles.darkText]}>Recommended Communities</Text>

        {loadingPublic ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00FF80" />
          </View>
        ) : publicCommunities.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, theme === 'dark' && styles.darkText]}>No public communities available</Text>
          </View>
        ) : (
          <View style={styles.otherCommunitiesList}>
          {publicCommunities.map((community) => (
            <View key={community.id} style={[styles.communityCard, theme === 'dark' && styles.darkCard]}>
              <View style={styles.communityCardTop}>
                <Image 
                  source={{ uri: community.imageUrl || 'https://s2.coinmarketcap.com/static/img/coins/200x200/5426.png' }} 
                  style={styles.communityCardImage} 
                />
                <View style={styles.communityCardContent}>
                  <Text style={[styles.communityCardTitle, theme === 'dark' && styles.darkText]}>{community.title}</Text>
                  <Text style={[styles.communityCardDescription, theme === 'dark' && styles.darkSecondaryText]} numberOfLines={1}>
                    Join {community.title} to connect with like-minded learners and grow together
                  </Text>
                  <Text style={[styles.communityCardMembers, theme === 'dark' && styles.darkSecondaryText]}>
                    {communityDetails[community.id]?.memberCount !== undefined
                      ? `${communityDetails[community.id].memberCount} members`
                      : 'Loading members...'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.communityCardActions}>
                <TouchableOpacity style={[styles.viewButton, theme === 'dark' && styles.darkViewButton]}>
                  <Text style={[styles.viewButtonText, theme === 'dark' && styles.darkViewButtonText]}>View</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.joinCardButton, theme === 'dark' && styles.darkButton]}
                  onPress={() => handleOpenBottomSheet(community)}
                >
                  <Text style={[styles.joinCardButtonText, theme === 'dark' && styles.darkButtonText]}>Join Now</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          </View>
        )}
      </View>
      </ScrollView>

      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        backgroundStyle={[styles.bottomSheetBackground, theme === 'dark' && styles.darkBottomSheet]}
        handleIndicatorStyle={[styles.bottomSheetIndicator, theme === 'dark' && styles.darkIndicator]}
        enablePanDownToClose={true}
        enableDismissOnClose={true}
        style={{ zIndex: 9999 }}
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          {bottomSheetStep === 'confirm' && (
            <>
              <View style={styles.bottomSheetHeader}>
                <View>
                    <Text style={[styles.bottomSheetTitle, theme === 'dark' && styles.darkText]}>Request to Join Community</Text>
                    <Text style={[styles.bottomSheetDescription, theme === 'dark' && styles.darkSecondaryText]}>You are about to request access to join community. You'll be allowed to join once a moderator approves your request. Do you want to continue?</Text>
                </View>
              </View>

              {selectedCommunity && (
                <View style={styles.bottomSheetCommunityInfo}>
                  <Image 
                    source={{ uri: selectedCommunity.imageUrl || 'https://s2.coinmarketcap.com/static/img/coins/200x200/5426.png' }} 
                    style={styles.bottomSheetCommunityImage} 
                  />
                  <View style={styles.bottomSheetCommunityDetails}>
                    <Text style={[styles.bottomSheetCommunityTitle, theme === 'dark' && styles.darkText]}>
                      {selectedCommunity.title}
                    </Text>
                    <Text style={[styles.bottomSheetCommunityDescription, theme === 'dark' && styles.darkSecondaryText]}>
                      {selectedCommunity.visibility === 'public' ? '🌐 Public Community' : '🔒 Private Community'}
                    </Text>
                    <View style={styles.bottomSheetCommunityStats}>
                      <View style={styles.statItem}>
                        <FontAwesome5 name="globe" size={14} color={theme === 'dark' ? '#B3B3B3' : '#61728C'} />
                        <Text style={[styles.statText, theme === 'dark' && styles.darkSecondaryText]}>{selectedCommunity.visibility}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}

              <View style={styles.bottomSheetActions}>
                <TouchableOpacity 
                  style={[styles.bottomSheetCancelButton, theme === 'dark' && styles.darkViewButton]}
                  onPress={handleCloseBottomSheet}
                >
                  <Text style={[styles.bottomSheetCancelButtonText, theme === 'dark' && styles.darkViewButtonText]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.bottomSheetJoinButton, theme === 'dark' && styles.darkButton]}
                  onPress={handleJoinRequest}
                >
                  <Text style={[styles.bottomSheetJoinButtonText, theme === 'dark' && styles.darkButtonText]}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
          {bottomSheetStep === 'processing' && (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" color="#00FF80" />
              <Text style={[styles.processingText, theme === 'dark' && styles.darkText]}>Sending request...</Text>
            </View>
          )}
          {bottomSheetStep === 'success' && selectedCommunity && (
            <>
              <View style={styles.successContainer}>
                <View style={styles.successBadge}>
                <Image
          source={require("@/assets/images/icons/SealCheck.png")}
          style={styles.successBadgeImage}
        />
                </View>
                <Text style={[styles.successMessage, theme === 'dark' && styles.darkSecondaryText]}>
                  Your request to join <Text style={[styles.communityNameBold, theme === 'dark' && styles.darkText]}>{selectedCommunity.title}</Text> has been submitted. You'll be allowed to join once a moderator approves your request.
                </Text>
              </View>

              <TouchableOpacity 
                style={[styles.doneButton, theme === 'dark' && styles.darkButton]}
                onPress={() => {
                  handleCloseBottomSheet()
                  setBottomSheetStep('confirm')
                  setCode('')
                  setError(false)
                  setErrorMessage('')
                  setSuccess(false)
                  setSelectedCommunity(null)
                  router.back()
                }}
              >
                <Text style={[styles.doneButtonText, theme === 'dark' && styles.darkButtonText]}>Done</Text>
              </TouchableOpacity>
            </>
          )}
        </BottomSheetView>
      </BottomSheetModal>
    </>
  )
}

export default joinCommunity

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FBFC',
  },
  topNav: {
    marginTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '500',
    color: '#2D3C52',
    fontFamily: 'Satoshi',
    lineHeight: 24,
  },
  joinCommunity: {
    paddingHorizontal: 24,
    gap: 16,
  },
  joinCommunityTitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#61728C',
    fontFamily: 'Satoshi',
    lineHeight: 24,
  },
  input: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 0.75,
    backgroundColor: '#fff',
    borderColor: '#EDF3FC',
    color: '#2D3C52',
    lineHeight: 16,
    fontFamily: 'Satoshi',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 12,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: "#00FF80",
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Satoshi',
    lineHeight: 24,
  },
  inviteContainer: {
    gap: 8,
  },
  inviteTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#61728C',
    fontFamily: 'Satoshi',
    lineHeight: 24,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FF0000',
    fontFamily: 'Satoshi',
    marginTop: 4,
  },
  otherCommunities: {
    paddingHorizontal: 24,
    marginTop: 32,
    gap: 16,
    paddingBottom: 40,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#EDF3FC',
  },
  otherCommunitiesTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#61728C',
    fontFamily: 'Satoshi',
    lineHeight: 24,
  },
  otherCommunitiesDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3C52',
    fontFamily: 'Satoshi',
    lineHeight: 24,
  },
  otherCommunitiesList: {
    gap: 16,
  },
  communityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EDF3FC',
    gap: 16,
  },
  communityCardTop: {
    flexDirection: 'row',
    gap: 12,
  },
  communityCardImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  communityCardContent: {
    flex: 1,
    gap: 4,
  },
  communityCardTitle: {
    fontFamily: 'Satoshi',
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3C52',
  },
  communityCardDescription: {
    fontFamily: 'Satoshi',
    fontSize: 13,
    fontWeight: '400',
    color: '#61728C',
    lineHeight: 18,
    flex: 1,
  },
  communityCardMembers: {
    fontFamily: 'Satoshi',
    fontSize: 12,
    fontWeight: '500',
    color: '#61728C',
    marginTop: 4,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: 'Satoshi',
    fontSize: 14,
    fontWeight: '500',
    color: '#61728C',
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 40,
  },
  processingText: {
    fontFamily: 'Satoshi',
    fontSize: 16,
    fontWeight: '500',
    color: '#2D3C52',
  },
  communityCardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  viewButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  viewButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Satoshi',
  },
  joinCardButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  joinCardButtonText: {
    color: '#00FF80',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Satoshi',
  },
  bottomSheetBackground: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 20,
  },
  bottomSheetIndicator: {
    backgroundColor: '#EDF3FC',
    width: 40,
    height: 4,
  },
  bottomSheetContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 16
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 24,
    zIndex: 10,
    padding: 4,
  },
  bottomSheetHeader: {
    marginBottom: 20,
  },
  bottomSheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D3C52',
    fontFamily: 'Satoshi',
  },
  bottomSheetCommunityInfo: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  bottomSheetCommunityImage: {
    width: 100,
    height: 100,
    borderRadius: 16,
  },
  bottomSheetCommunityDetails: {
    flex: 1,
    gap: 6,
  },
  bottomSheetCommunityTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3C52',
    fontFamily: 'Satoshi',
  },
  bottomSheetCommunityDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: '#61728C',
    fontFamily: 'Satoshi',
    lineHeight: 18,
  },
  bottomSheetCommunityStats: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#61728C',
    fontFamily: 'Satoshi',
  },
  bottomSheetDivider: {
    height: 1,
    backgroundColor: '#EDF3FC',
    marginBottom: 20,
  },
  bottomSheetInfoSection: {
    gap: 12,
    marginBottom: 24,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoIconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#2D3C52',
    fontFamily: 'Satoshi',
  },
  bottomSheetActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 'auto',
  },
  bottomSheetCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSheetCancelButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Satoshi',
  },
  bottomSheetJoinButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00FF80',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.15,
    shadowRadius: 25,
    elevation: 12,
  },
  bottomSheetJoinButtonText: {
    color: '#00FF80',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Satoshi',
  },
  bottomSheetDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: '#61728C',
    fontFamily: 'Satoshi',
    lineHeight: 18,
    marginBottom: 20,
    marginTop: 8,
  },
  bottomSheetProcessing: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  bottomSheetSuccess: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 20,
  },
  successIconContainer: {
    marginBottom: 8,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D3C52',
    fontFamily: 'Satoshi',
  },
  successDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: '#61728C',
    fontFamily: 'Satoshi',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  successBadge: {
    
  },
  successMessage: {
    fontSize: 15,
    fontWeight: '400',
    color: '#61728C',
    fontFamily: 'Satoshi',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  communityNameBold: {
    fontWeight: '700',
    color: '#2D3C52',
  },
  doneButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
  },
  doneButtonText: {
    color: '#00FF80',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Satoshi',
  },
  successBadgeImage: {
    width: 120,
    height: 120,
  },
  darkContainer: {
    backgroundColor: '#0D0D0D',
  },
  darkSecondaryText: {
    color: '#B3B3B3',
  },
  darkText: {
    color: '#E0E0E0',
  },
  darkButton: {
    backgroundColor: '#00FF80',
  },
  darkButtonText: {
    color: '#000',
  },
  darkInput: {
    backgroundColor: '#131313',
    borderColor: '#2E3033',
    color: '#E0E0E0',
  },
  darkCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  darkViewButton: {
    backgroundColor: 'transparent',
    borderColor: '#00FF80',
  },
  darkViewButtonText: {
    color: '#00FF80',
  },
  darkDivider: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  darkBottomSheet: {
    backgroundColor: '#1b1818',
  },
  darkIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
})