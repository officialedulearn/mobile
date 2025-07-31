export type Chat = {
    title: string;
    userId: string;
    id: string;
    createdAt: Date;
    visibility: "public" | "private";
    tested: boolean | null;
}

export type Message = {
    id: string;
    createdAt: Date;
    chatId: string;
    role: string;
    content: unknown;
}