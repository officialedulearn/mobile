import { Image, StyleSheet, Text, TouchableOpacity, View, ScrollView, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native'
import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react'
import BackButton from '@/components/backButton'
import useUserStore from '@/core/userState'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import Entypo from '@expo/vector-icons/Entypo'
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet'
import * as Haptics from 'expo-haptics'
import AnimatedPressable from '@/components/AnimatedPressable'
import { router, useLocalSearchParams } from 'expo-router'
import { CommunityService } from '@/services/community.service'
import type { Community, RoomMessage, NewMessageEvent, ReactionEvent } from '@/interface/Community'

const communityService = new CommunityService()

type MessageWithUI = RoomMessage & {
  date: string
  time: string
  isCurrentUser: boolean
  reactions: { [key: string]: number }
  userAvatar?: string
  userName?: string
  isMod?: boolean
  message?: string
}

const groupMessagesByDate = (messages: MessageWithUI[]) => {
  const grouped: { [key: string]: MessageWithUI[] } = {}
  
  messages.forEach((msg) => {
    if (!grouped[msg.date]) {
      grouped[msg.date] = []
    }
    grouped[msg.date].push(msg)
  })
  
  return grouped
}

const parseMentions = (text: string): string[] => {
  const mentionRegex = /@(\w+)/g
  const matches = text.match(mentionRegex)
  if (!matches) return []
  
  return matches.map(match => match.substring(1))
}

const formatDateHeader = (dateString: string) => {
  const date = new Date(dateString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  const dateOnly = dateString.split('T')[0]
  const todayStr = today.toISOString().split('T')[0]
  const yesterdayStr = yesterday.toISOString().split('T')[0]
  
  if (dateOnly === todayStr) {
    return 'Today'
  } else if (dateOnly === yesterdayStr) {
    return 'Yesterday'
  } else {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${date.getDate()} ${months[date.getMonth()]}, ${date.getFullYear()}`
  }
}

const formatMessageTime = (timestamp: Date | string) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

const formatMessageDate = (timestamp: Date | string) => {
  const date = new Date(timestamp)
  return date.toISOString().split('T')[0]
}

const Room = () => {
  const { id } = useLocalSearchParams<{ id: string }>()
  const theme = useUserStore((state) => state.theme)
  const user = useUserStore((state) => state.user)
  const [message, setMessage] = useState('')
  const [community, setCommunity] = useState<Community | null>(null)
  const [messages, setMessages] = useState<MessageWithUI[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isMod, setIsMod] = useState(false)
  const [moderatorId, setModeratorId] = useState<string | null>(null)
  const [onlineCount, setOnlineCount] = useState(1)
  const scrollViewRef = useRef<ScrollView>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const messageActionSheetRef = useRef<BottomSheetModal>(null)
  const [selectedMessage, setSelectedMessage] = useState<MessageWithUI | null>(null)
  const snapPoints = useMemo(() => ['50%'], [])

  const groupedMessages = useMemo(() => groupMessagesByDate(messages), [messages])

  useEffect(() => {
    if (!id || !user?.id) return
    loadCommunityData()
  }, [id, user?.id])

  useEffect(() => {
    const communityId = Array.isArray(id) ? id[0] : id
    if (!communityId || !user?.id) return

    const setupWebSocket = async () => {
      if (!user?.id || !communityId) return
      
      try {
        await communityService.connectWebSocket()
        communityService.joinRoom(communityId, user.id, (response) => {
          if (response?.error) {
            console.error('Error joining room:', response.error)
          } else {
            console.log('✅ Successfully joined room:', communityId)
          }
        })

        communityService.onRoomJoined((data) => {
          if (data.onlineCount !== undefined) {
            setOnlineCount(data.onlineCount)
          }
        })

        communityService.onRoomUserJoined((data) => {
          if (data.onlineCount !== undefined) {
            setOnlineCount(data.onlineCount)
          } else {
            setOnlineCount(prev => prev + 1)
          }
        })

        communityService.onRoomUserLeft((data) => {
          if (data.onlineCount !== undefined) {
            setOnlineCount(data.onlineCount)
          } else {
            setOnlineCount(prev => Math.max(1, prev - 1))
          }
        })

        communityService.onUserStatus((data) => {
          if (data.status === 'online' || data.status === 'offline') {
         
            console.log('User status changed:', data.userId, data.status)
          }
        })

        communityService.onNewMessage(async (event: NewMessageEvent) => {
          try {
            const reactions = await communityService.getMessageReactions(event.id)
            const reactionCounts: { [key: string]: number } = {}
            reactions.forEach(r => {
              reactionCounts[r.reaction] = (reactionCounts[r.reaction] || 0) + 1
            })
            const newMessage = processMessage({ ...event, reactionCounts })
            setMessages(prev => [...prev, newMessage])
            setTimeout(() => {
              scrollViewRef.current?.scrollToEnd({ animated: true })
            }, 100)
          } catch (error) {
            console.error('Error processing new message:', error)
            const newMessage = processMessage({ ...event })
            setMessages(prev => [...prev, newMessage])
            setTimeout(() => {
              scrollViewRef.current?.scrollToEnd({ animated: true })
            }, 100)
          }
        })

        communityService.onReactionAdded((event: ReactionEvent) => {
          setMessages(prev => prev.map(msg => {
            if (msg.id === event.messageId) {
              const reactions: { [key: string]: number } = {}
              event.reactionCounts.forEach(rc => {
                reactions[rc.reaction] = rc.count
              })
              return {
                ...msg,
                reactions
              }
            }
            return msg
          }))
        })

        communityService.onReactionRemoved((event) => {
          setMessages(prev => prev.map(msg => {
            if (msg.id === event.messageId) {
              const reactions: { [key: string]: number } = {}
              event.reactionCounts.forEach(rc => {
                reactions[rc.reaction] = rc.count
              })
              return {
                ...msg,
                reactions
              }
            }
            return msg
          }))
        })
      } catch (error) {
        console.error('WebSocket setup error:', error)
      }
    }

    setupWebSocket()

    return () => {
      const communityId = Array.isArray(id) ? id[0] : id
      if (communityId) {
        communityService.leaveRoom(communityId)
        communityService.disconnectWebSocket()
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [id, user?.id, moderatorId])

  const loadCommunityData = async () => {
    const communityId = Array.isArray(id) ? id[0] : id
    if (!communityId || !user?.id) return
    
    try {
      setIsLoading(true)
      const [communityData, messagesData] = await Promise.all([
        communityService.getCommunityById(communityId),
        communityService.getRoomMessages(communityId, 50, 0, user.id)
      ])

      setCommunity(communityData)
      
      let modUserId: string | null = null
      try {
        const modData = await communityService.getCommunityMod(communityId)
        if (modData) {
          modUserId = modData.user.id
          setModeratorId(modData.user.id)
          setIsMod(modData.user.id === user.id)
        }
      } catch (error) {
        console.error('Error fetching mod info:', error)
      }
      
      const messagesWithReactions = await Promise.all(
        messagesData.map(async (msg) => {
          try {
            const reactions = await communityService.getMessageReactions(msg.id)
            const reactionCounts: { [key: string]: number } = {}
            reactions.forEach(r => {
              reactionCounts[r.reaction] = (reactionCounts[r.reaction] || 0) + 1
            })
            return { ...msg, reactionCounts, isMod: modUserId === msg.user.id }
          } catch (error) {
            console.error(`Error fetching reactions for message ${msg.id}:`, error)
            return { ...msg, reactionCounts: {}, isMod: modUserId === msg.user.id }
          }
        })
      )

      const processedMessages = messagesWithReactions.reverse().map(processMessage)
      setMessages(processedMessages)
      
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false })
      }, 100)
    } catch (error) {
      console.error('Error loading community data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const processMessage = (msg: RoomMessage & { reactionCounts?: { [key: string]: number }; isMod?: boolean }): MessageWithUI => {
    const timestamp = new Date(msg.createdAt)
    const reactions: { [key: string]: number } = {}
    if (msg.reactionCounts) {
      Object.entries(msg.reactionCounts).forEach(([emoji, count]) => {
        reactions[emoji] = count
      })
    }
    
    return {
      ...msg,
      date: formatMessageDate(timestamp),
      time: formatMessageTime(timestamp),
      isCurrentUser: msg.user.id === user?.id,
      reactions: reactions,
      userAvatar: msg.user.profilePictureURL || undefined,
      userName: `@${msg.user.username}`,
      isMod: msg.isMod || false,
      message: msg.content
    }
  }

  const handleSendMessage = async () => {
    const communityId = Array.isArray(id) ? id[0] : id
    if (!message.trim() || !communityId || !user?.id || isSending) return

    const messageContent = message.trim()
    setMessage('')
    setIsSending(true)

    try {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      communityService.stopTyping(communityId)

      if (!communityService.isConnected()) {
        await communityService.connectWebSocket()
        communityService.joinRoom(communityId, user.id)
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      const mentionedUsernames = parseMentions(messageContent)
      let mentionedUserIds: string[] = []

      if (mentionedUsernames.length > 0) {
        try {
          const resolvedMentions = await communityService.resolveMentions(mentionedUsernames)
          mentionedUserIds = resolvedMentions.map(m => m.userId)
        } catch (error) {
          console.error('Error resolving mentions:', error)
        }
      }

      communityService.sendMessage(communityId, messageContent, mentionedUserIds.length > 0 ? mentionedUserIds : undefined, user.id, (response) => {
        if (response?.error) {
          console.error('Error sending message:', response.error)
          setMessage(messageContent)
          
          const errorMessage = response.error === 'Database connection error. Please try again.' 
            ? 'Connection issue. Please try again.'
            : response.error || 'Failed to send message'
          
          console.error('Error details:', errorMessage)
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
          
          if (response.retryable) {
            console.log('Error is retryable, user can try again')
          }
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        }
        setIsSending(false)
      })
    } catch (error) {
      console.error('Error sending message:', error)
      setMessage(messageContent)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      setIsSending(false)
    }
  }

  const handleTyping = (text: string) => {
    setMessage(text)

    const communityId = Array.isArray(id) ? id[0] : id
    if (!communityId) return
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    if (text.length > 0) {
      communityService.startTyping(communityId)
      
      typingTimeoutRef.current = setTimeout(() => {
        communityService.stopTyping(communityId)
      }, 3000) as unknown as NodeJS.Timeout
    } else {
      communityService.stopTyping(communityId)
    }
  }

  const handleReaction = async (emoji: string) => {
    if (!selectedMessage || !user?.id) return
    const communityId = Array.isArray(id) ? id[0] : id
    if (!communityId) return

    try {
      setMessages(prev => prev.map(msg => {
        if (msg.id === selectedMessage.id) {
          const currentCount = msg.reactions[emoji] || 0
          return {
            ...msg,
            reactions: {
              ...msg.reactions,
              [emoji]: currentCount + 1
            }
          }
        }
        return msg
      }))

      await communityService.addReaction(selectedMessage.id, emoji, user.id, communityId)
      
      handleCloseMessageActions()
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    } catch (error) {
      console.error('Error adding reaction:', error)
      setMessages(prev => prev.map(msg => {
        if (msg.id === selectedMessage.id) {
          const currentCount = msg.reactions[emoji] || 0
          return {
            ...msg,
            reactions: {
              ...msg.reactions,
              [emoji]: Math.max(0, currentCount - 1)
            }
          }
        }
        return msg
      }))
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
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
  const handleMessageLongPress = (msg: MessageWithUI) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setSelectedMessage(msg)
    messageActionSheetRef.current?.present()
  }

  const handleCloseMessageActions = () => {
    messageActionSheetRef.current?.dismiss()
    setSelectedMessage(null)
  }

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent, theme === 'dark' && styles.darkContainer]}>
        <ActivityIndicator size="large" color={theme === 'dark' ? '#00FF80' : '#000'} />
        <Text style={[styles.loadingText, theme === 'dark' && styles.darkText]}>Loading community...</Text>
      </View>
    )
  }

  if (!community) {
    return (
      <View style={[styles.container, styles.centerContent, theme === 'dark' && styles.darkContainer]}>
        <Text style={[styles.errorText, theme === 'dark' && styles.darkText]}>Community not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView 
      style={[styles.container, theme === 'dark' && styles.darkContainer]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View style={[styles.topNav, theme === 'dark' && styles.darkTopNav]}>
        <BackButton />
        <View style={styles.centerSection}>
          <Image 
            source={{ uri: community.imageUrl || 'https://s2.coinmarketcap.com/static/img/coins/200x200/5426.png' }} 
            style={styles.communityImage} 
          />  
          <View>
          <Text style={[styles.title, theme === 'dark' && styles.darkTitle]}>
            {community.title}
          </Text>
          <Text style={[styles.onlineStatus, theme === 'dark' && styles.darkOnlineStatus]}>
            {onlineCount === 1 ? 'Just you here' : `🟢 ${onlineCount} online`}
          </Text>
          </View>
        </View>
        
        <AnimatedPressable 
          style={[
            styles.infoButton,
            theme === 'dark' && styles.darkInfoButton
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            router.push({
              pathname: '/roomInfo/[id]',
              params: { id: Array.isArray(id) ? id[0] : id }
            })
          }}
          scale={0.9}
          hapticFeedback={true}
        >
          <Image
            source={
              theme === 'dark' 
                ? require('@/assets/images/icons/dark/information-circle.png') 
                : require('@/assets/images/icons/information-circle.png')
            }
            style={styles.infoIcon}
          />
        </AnimatedPressable>
      </View>
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
        >
        {Object.keys(groupedMessages).sort().map((date) => (
          <View key={date}>
            <View style={styles.dateDivider}>
              <View style={styles.dateDividerLine} />
              <Text style={styles.dateDividerText}>{formatDateHeader(date)}</Text>
              <View style={styles.dateDividerLine} />
            </View>

            {groupedMessages[date].map((msg) => (
              <View key={msg.id} style={styles.messageWrapper}>
                {msg.isCurrentUser ? (
                  <>
                    <View style={styles.currentUserMessageContainer}>
                      <AnimatedPressable 
                        style={styles.currentUserMessage}
                        onLongPress={() => handleMessageLongPress(msg)}
                        scale={0.98}
                        hapticFeedback={true}
                        hapticStyle="medium"
                      >
                        <Text style={styles.currentUserMessageText}>{msg.message || msg.content}</Text>
                      </AnimatedPressable>
                    </View>
                    
                    {Object.keys(msg.reactions).length > 0 && (
                      <View style={styles.currentUserReactionsContainer}>
                        <View style={styles.currentUserReactions}>
                          {Object.entries(msg.reactions).map(([emoji, count]) => (
                            <View key={emoji} style={styles.reactionBadge}>
                              <Text style={styles.reactionEmoji}>{emoji}</Text>
                              <Text style={styles.reactionCount}>{count}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                  </>
                ) : (
                  <>
                    <View style={styles.otherUserMessageContainer}>
                      <Image source={{ uri: msg.userAvatar || msg.user.profilePictureURL || 'https://i.pravatar.cc/150' }} style={styles.userAvatar} />
                      <AnimatedPressable 
                        style={styles.otherUserMessage}
                        onLongPress={() => handleMessageLongPress(msg)}
                        scale={0.98}
                        hapticFeedback={true}
                        hapticStyle="medium"
                      >
                        <View style={styles.messageHeader}>
                          <View style={styles.userNameRow}>
                            <Text style={styles.userName}>{msg.userName || `@${msg.user.username}`}</Text>
                            {msg.isMod && (
                              <View style={styles.modBadge}>
                                <Text style={styles.modBadgeText}>MOD</Text>
                              </View>
                            )}
                            <Text style={styles.timestamp}> • {msg.time}</Text>
                          </View>
                        </View>
                        <Text style={styles.messageText}>{msg.message || msg.content}</Text>
                      </AnimatedPressable>
                    </View>
                    {Object.keys(msg.reactions).length > 0 && (
                      <View style={styles.otherUserReactionsContainer}>
                        <View style={styles.reactions}>
                          {Object.entries(msg.reactions).map(([emoji, count]) => (
                            <View key={emoji} style={styles.reactionBadge}>
                              <Text style={styles.reactionEmoji}>{emoji}</Text>
                              <Text style={styles.reactionCount}>{count}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                  </>
                )}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>

      <View style={[styles.inputContainer, theme === 'dark' && styles.darkInputContainer]}>
        <TextInput
          style={[styles.input, theme === 'dark' && styles.darkInput]}
          placeholder="Type a message..."
          placeholderTextColor="#A0AEC0"
          value={message}
          onChangeText={handleTyping}
          multiline
          editable={!isSending}
        />
        <AnimatedPressable 
          style={[styles.sendButton, isSending && styles.sendButtonDisabled]} 
          scale={0.85} 
          hapticFeedback={true} 
          hapticStyle="medium"
          onPress={handleSendMessage}
          disabled={isSending || !message.trim()}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#718096" />
          ) : (
            <Image
            source={
              theme === "dark"
                ? require("@/assets/images/icons/dark/send-2.png")
                : require("@/assets/images/icons/send-2.png")
            }
            style={styles.messageActionIcon}
          />
          )}
        </AnimatedPressable>
      </View>

      <BottomSheetModal
        ref={messageActionSheetRef}
        index={0}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.bottomSheetIndicator}
        enablePanDownToClose={true}
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          <AnimatedPressable 
            style={styles.closeButton}
            onPress={handleCloseMessageActions}
            scale={0.85}
            hapticFeedback={true}
          >
            <FontAwesome5 name="times" size={20} color="#61728C" />
          </AnimatedPressable>

          <View style={styles.reactingToSection}>
            <View style={styles.reactingToHeader}>
              <Entypo name="emoji-happy" size={16} color="#61728C" />
              <Text style={styles.reactingToText}>Reacting to</Text>
            </View>
            <View style={styles.reactingToMessageBox}>
              <Text style={styles.reactingToMessage}>
                <Text style={styles.mentionText}>{selectedMessage?.userName || `@${selectedMessage?.user.username}` || '@user'}</Text>
                {' '}
                {selectedMessage?.message || selectedMessage?.content}
              </Text>
            </View>
          </View>
          <View style={styles.emojiReactionsRow}>
            <AnimatedPressable style={styles.emojiReactionButton} scale={0.85} hapticFeedback={true} onPress={() => handleReaction('💚')}>
              <Text style={styles.emojiReaction}>💚</Text>
            </AnimatedPressable>
            <AnimatedPressable style={styles.emojiReactionButton} scale={0.85} hapticFeedback={true} onPress={() => handleReaction('💪')}>
              <Text style={styles.emojiReaction}>💪</Text>
            </AnimatedPressable>
            <AnimatedPressable style={styles.emojiReactionButton} scale={0.85} hapticFeedback={true} onPress={() => handleReaction('👍')}>
              <Text style={styles.emojiReaction}>👍</Text>
            </AnimatedPressable>
            <AnimatedPressable style={styles.emojiReactionButton} scale={0.85} hapticFeedback={true} onPress={() => handleReaction('👎')}>
              <Text style={styles.emojiReaction}>👎</Text>
            </AnimatedPressable>
            <AnimatedPressable style={styles.emojiReactionButton} scale={0.85} hapticFeedback={true} onPress={() => handleReaction('💔')}>
              <Text style={styles.emojiReaction}>💔</Text>
            </AnimatedPressable>
            <AnimatedPressable style={styles.emojiReactionButton} scale={0.85} hapticFeedback={true} onPress={() => handleReaction('😊')}>
              <Text style={styles.emojiReaction}>😊</Text>
            </AnimatedPressable>
          </View>
          <View style={styles.actionButtonsContainer}>
            <AnimatedPressable style={styles.actionButton} scale={0.97} hapticFeedback={true}>
              <FontAwesome5 name="copy" size={18} color="#4A5568" />
              <Text style={styles.actionButtonText}>Copy Text</Text>
            </AnimatedPressable>

            <AnimatedPressable style={styles.actionButton} scale={0.97} hapticFeedback={true}>
              <FontAwesome5 name="user" size={18} color="#4A5568" />
              <Text style={styles.actionButtonText}>View Profile</Text>
            </AnimatedPressable>

            {isMod && (
              <AnimatedPressable style={[styles.actionButton, styles.actionButtonDanger]} scale={0.97} hapticFeedback={true} hapticStyle="medium">
                <FontAwesome5 name="user-times" size={18} color="#FF3B30" />
                <Text style={[styles.actionButtonText, styles.actionButtonTextDanger]}>Remove User</Text>
              </AnimatedPressable>
            )}

            {(isMod || selectedMessage?.isCurrentUser) && selectedMessage && (
              <AnimatedPressable 
                style={[styles.actionButton, styles.actionButtonDanger]} 
                scale={0.97} 
                hapticFeedback={true} 
                hapticStyle="medium"
                onPress={async () => {
                  if (!selectedMessage || !user?.id) return
                  try {
                    await communityService.deleteMessage(selectedMessage.id, user.id)
                    setMessages(prev => prev.filter(m => m.id !== selectedMessage.id))
                    handleCloseMessageActions()
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
                  } catch (error) {
                    console.error('Error deleting message:', error)
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
                  }
                }}
              >
                <FontAwesome5 name="trash" size={18} color="#FF3B30" />
                <Text style={[styles.actionButtonText, styles.actionButtonTextDanger]}>Delete Message</Text>
              </AnimatedPressable>
            )}
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </KeyboardAvoidingView>
  )
}

export default Room

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FBFC',
  },
  darkContainer: {
    backgroundColor: '#000000',
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EDF3FC',
  },
  darkTopNav: {
    backgroundColor: '#131313',
    borderBottomColor: '#2E3033',
  },
  messageActionIcon: {
    width: 24,
    height: 24
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  communityImage: {
    width: 40,
    height: 40,
    borderRadius: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '500',
    fontFamily: 'Satoshi',
    color: '#2D3C52',
  },
  darkTitle: {
    color: '#FFFFFF',
  },
  onlineStatus: {
    fontSize: 13,
    fontWeight: '400',
    color: '#61728C',
    fontFamily: 'Satoshi',
    marginTop: 4,
  },
  darkOnlineStatus: {
    color: '#B3B3B3',
  },
  infoButton: {
    padding: 10,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 50,
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: '#EDF3FC',
  },
  darkInfoButton: {
    backgroundColor: '#131313',
    borderColor: '#2E3033',
  },
  infoIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#F9FBFC',
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  dateDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  dateDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dateDividerText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#A0AEC0',
    fontFamily: 'Satoshi',
  },
  messageWrapper: {
    marginBottom: 12,
  },
  otherUserMessageContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    width: '100%',
    marginBottom: 4,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    flexShrink: 0,
  },
  otherUserMessage: {
    maxWidth: '75%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    flexShrink: 1,
    flexGrow: 0,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3C52',
    fontFamily: 'Satoshi',
  },
  timestamp: {
    fontSize: 11,
    fontWeight: '400',
    color: '#A0AEC0',
    fontFamily: 'Satoshi',
  },
  messageText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#4A5568',
    fontFamily: 'Satoshi',
    lineHeight: 20,
  },
  reactionsContainer: {
    marginTop: 6,
  },
  otherUserReactionsContainer: {
    paddingLeft: 44,
    marginTop: 6,
  },
  currentUserReactionsContainer: {
    paddingRight: 0,
    marginTop: 6,
    alignItems: 'flex-end',
  },
  reactions: {
    flexDirection: 'row',
    gap: 8,
  },
  reactionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4A5568',
    fontFamily: 'Satoshi',
  },
  messageActionButton: {
    padding: 4,
  },
  messageEmoji: {
    fontSize: 20,
  },
  // Current User Messages (Blue)
  currentUserMessageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    width: '100%',
    marginBottom: 4,
  },
  currentUserMessage: {
    maxWidth: '75%',
    backgroundColor: '#131313',
    borderRadius: 12,
    padding: 12,
  },
  currentUserMessageHeader: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  currentUserAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  currentUserInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  currentUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00FF80',
    fontFamily: 'Satoshi',
  },
  verifiedBadge: {
    width: 16,
    height: 16,
  },
  modBadge: {
    backgroundColor: '#000000',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 4,
  },
  modBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#00FF80',
    fontFamily: 'Satoshi',
  },
  currentUserTimestamp: {
    fontSize: 11,
    fontWeight: '400',
    color: '#A0AEC0',
    fontFamily: 'Satoshi',
  },
  currentUserMessageText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#FFFFFF',
    fontFamily: 'Satoshi',
    lineHeight: 20,
  },
  currentUserReactions: {
    flexDirection: 'row',
    gap: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EDF3FC',
    gap: 12,
  },
  darkInputContainer: {
    backgroundColor: '#131313',
    borderTopColor: '#2E3033',
  },
  emojiButton: {
    width: 36,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FBFC',
    borderWidth: 0.6,
    borderColor: '#EDF3FC',
    padding: 5.5,
    gap: 100,
  },
  emojiButtonText: {
    fontSize: 24,
  },
  input: {
    flex: 1,
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: 'Satoshi',
    color: '#61728C',
    height: 48,
    maxHeight: 100,
  },
  darkInput: {
    backgroundColor: '#1F2937',
    color: '#FFFFFF',
  },
  sendButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontFamily: 'Satoshi',
    fontSize: 16,
    fontWeight: '500',
    color: '#2D3C52',
  },
  darkText: {
    color: '#E0E0E0',
  },
  errorText: {
    fontFamily: 'Satoshi',
    fontSize: 16,
    fontWeight: '500',
    color: '#FF3B30',
    textAlign: 'center',
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: '#000',
    borderRadius: 16,
    marginTop: 16,
  },
  backButtonText: {
    color: '#00FF80',
    fontFamily: 'Satoshi',
    fontSize: 14,
    fontWeight: '600',
  },
  // Bottom Sheet Styles
  bottomSheetBackground: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  bottomSheetIndicator: {
    backgroundColor: '#EDF3FC',
    width: 40,
    height: 4,
  },
  bottomSheetContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 24,
    zIndex: 10,
    padding: 4,
  },
  reactingToSection: {
    marginBottom: 24,
  },
  reactingToHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  reactingToText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#61728C',
    fontFamily: 'Satoshi',
  },
  reactingToMessageBox: {
    backgroundColor: '#C8F4DD',
    borderRadius: 12,
    padding: 12,
  },
  reactingToMessage: {
    fontSize: 13,
    fontWeight: '400',
    color: '#2D3C52',
    fontFamily: 'Satoshi',
    lineHeight: 18,
  },
  mentionText: {
    fontWeight: '600',
    color: '#2D3C52',
  },
  emojiReactionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  emojiReactionButton: {
    padding: 8,
  },
  emojiReaction: {
    fontSize: 32,
  },
  actionButtonsContainer: {
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#4A5568',
    fontFamily: 'Satoshi',
  },
  actionButtonDanger: {
  },
  actionButtonTextDanger: {
    color: '#FF3B30',
  },
})