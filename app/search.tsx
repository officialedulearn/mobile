import { StyleSheet, Text, View, TextInput, TouchableOpacity, Image, FlatList, ActivityIndicator } from 'react-native'
import React, { useEffect, useState } from 'react'
import BackButton from '@/components/backButton'
import { UserService } from '@/services/auth.service'
import { User } from '@/interface/User'
import { debounce } from '@/utils/utils'
import { StatusBar } from 'expo-status-bar'
import { router } from 'expo-router'

type SearchResultProps = {
    id: string;
    name: string;
    username: string;
    xp: number;
    streak: number;
    imageSource?: any;
}

const SearchResult = ({ id, name, username, xp, streak, imageSource }: SearchResultProps) => {
    return (
        <TouchableOpacity style={styles.result} onPress={() => {router.push(`/user/${id}`)}}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Image source={imageSource || require("@/assets/images/memoji.png")} style={{ width: 32, height: 32, borderRadius: 9.1, borderWidth: 0.66, borderColor: "#EDF3FC" }} />
                    <View style={{flexDirection: 'column', alignItems: 'flex-start'}}>
                        <Text style={styles.searchResultText}>{name}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Image source={require("@/assets/images/icons/medal-05.png")} style={{ width: 16, height: 16, marginRight: 4 }} />
                        <Text style={styles.searchResultText}>{xp}XP</Text>
                        </View>
                    </View>
                </View>
                <View style={styles.streak}>
                    <Text style={styles.streakText}>
                    🔥 {streak}-Day Streak
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

type Props = {}

const Search = (props: Props) => {
    const [users, setUsers] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const userService = new UserService();

    const debouncedSearch = React.useCallback(
        debounce(async (query: string) => {
            if (query.trim().length === 0) {
                setUsers([]);
                return;
            }
            
            setLoading(true);
            setError(null);
            
            try {
                const results = await userService.searchUsers(query);
                setUsers(results);
            } catch (err) {
                console.error('Search error:', err);
                setError('Failed to search users. Please try again.');
                setUsers([]);
            } finally {
                setLoading(false);
            }
        }, 500),
        []
    );

    useEffect(() => {
        debouncedSearch(searchQuery);
    }, [searchQuery]);

    const handleSearchInputChange = (text: string) => {
        setSearchQuery(text);
    };

    const renderItem = ({ item }: { item: User }) => (
        <SearchResult
            id={item.id}
            name={item.name}
            username={item.username || ''}
            xp={item.xp || 0}
            streak={item.streak || 0}
            imageSource={require("@/assets/images/memoji.png")}
        />
    );

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <View style={styles.topNav}>
                <BackButton />
                <Text style={styles.topNavText}>Search</Text>
            </View>
            <View style={styles.searchContainer}>
                <TextInput 
                    style={styles.searchInput} 
                    placeholder='Search for learners' 
                    value={searchQuery} 
                    onChangeText={handleSearchInputChange}
                    
                />
            </View>

            <View style={styles.topResults}>
                <Text style={{ fontFamily: 'Satoshi', fontSize: 16, color: '#2D3C52', fontWeight: '500', lineHeight: 26 }}>
                    {searchQuery.trim() ? 'Search Results' : 'Top Results'}
                </Text>
                
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#00FF80" />
                    </View>
                ) : error ? (
                    <Text style={styles.errorText}>{error}</Text>
                ) : users.length > 0 ? (
                    <FlatList
                        data={users}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.resultsList}
                        ItemSeparatorComponent={() => <View style={styles.separator} />}
                    />
                ) : searchQuery.trim() ? (
                    <Text style={styles.noResultsText}>No users found</Text>
                ) : (
                    <SearchResult 
                        id="default-user"
                        name="Ahmed Abiola" 
                        username="ahmed"
                        xp={700}
                        streak={29} 
                        imageSource={require("@/assets/images/memoji.png")} 
                    />
                )}
            </View>
        </View>
    );
}

export default Search

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#F9FBFC',
        marginTop: 50,
        flex: 1,
    },
    topNav: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#F9FBFC',
        gap: 16,
    },
    topNavText: {
        fontWeight: '500',
        fontFamily: 'Satoshi',
        fontSize: 20,
        color: '#2D3C52',
        lineHeight: 24,
    },
    searchContainer: {
        padding: 20,
        borderRadius: 16,
        marginTop: 10,
    },
    searchInput: {
        paddingTop: 14,
        paddingBottom: 16,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderRadius: 32,
        borderColor: '#EDF3FC',
        backgroundColor: "#fff",
        fontFamily: 'Satoshi',
    },
    topResults: {
        padding: 20,
        marginTop: 10,
        flex: 1,
    },
    searchResultText: {
        fontFamily: 'Satoshi',
        fontSize: 14,
        color: '#61728C',
        fontWeight: '500',
        lineHeight: 24,
    },
    result: {
        borderRadius: 16,
        paddingTop: 8,
        paddingBottom: 12,
        paddingHorizontal: 12,
        backgroundColor: '#FFFFFF',
        borderWidth: 0.5,
        borderColor: '#EDF3FC',
    },
    streak: {
        gap: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        paddingTop: 4,
        paddingBottom: 8,
        paddingHorizontal: 8,
        borderWidth: 0.4,
        borderColor: '#EDF3FC',
        backgroundColor: '#F9FBFC',
    },
    streakText: {
        fontFamily: 'Satoshi',
        fontSize: 10,
        color: '#61728C',
        fontWeight: '500',
        lineHeight: 16,
    },
    loadingContainer: {
        padding: 20,
        alignItems: 'center',
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        marginTop: 20,
    },
    noResultsText: {
        textAlign: 'center',
        marginTop: 20,
        color: '#61728C',
    },
    resultsList: {
        paddingTop: 10,
    },
    separator: {
        height: 10,
    }
})