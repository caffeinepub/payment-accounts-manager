import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Entry {
    id: string;
    dateCreated: bigint;
    name: string;
    paid: boolean;
    mobileNumber: string;
    commission: bigint;
    totalAmount: bigint;
    amount: bigint;
    advance: bigint;
}
export interface HistoryEntry {
    id: string;
    dateCreated: bigint;
    name: string;
    paid: boolean;
    mobileNumber: string;
    commission: bigint;
    totalAmount: bigint;
    amount: bigint;
    datePaid: bigint;
    advance: bigint;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createEntry(name: string, mobileNumber: string, amount: bigint, commission: bigint, advance: bigint): Promise<string>;
    deleteEntry(id: string): Promise<void>;
    deleteHistoryEntry(id: string): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getEntries(): Promise<Array<Entry>>;
    getHistoryEntries(): Promise<Array<HistoryEntry>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    moveEntryToHistory(id: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateEntry(id: string, name: string, mobileNumber: string, amount: bigint, commission: bigint, paid: boolean, advance: bigint): Promise<void>;
}
