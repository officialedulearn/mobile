export interface User {
    id: string;
    email: string;
    name: string;
    level: string;
    xp: number;
    referralCode: string;
    referralCount: number;
    referredBy: string | null;
    credits: number;
    address: string | null;
    streak: number;
    username: string;
    quizCompleted: number;
    isPremium: boolean;
    learning?: string;
    lastLoggedIn?: string | Date;
}