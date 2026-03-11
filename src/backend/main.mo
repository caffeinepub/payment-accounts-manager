import Time "mo:core/Time";
import Text "mo:core/Text";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";

import AccessControl "authorization/access-control";

actor {
  type Entry = {
    id : Text;
    name : Text;
    mobileNumber : Text;
    amount : Nat;
    commission : Nat;
    totalAmount : Nat;
    paid : Bool;
    dateCreated : Int;
    advance : Nat;
  };

  module Entry {
    public func compare(entry1 : Entry, entry2 : Entry) : Order.Order {
      Int.compare(entry2.dateCreated, entry1.dateCreated);
    };
  };

  type HistoryEntry = {
    id : Text;
    name : Text;
    mobileNumber : Text;
    amount : Nat;
    commission : Nat;
    totalAmount : Nat;
    paid : Bool;
    dateCreated : Int;
    advance : Nat;
    datePaid : Int;
  };

  module HistoryEntry {
    public func compare(entry1 : HistoryEntry, entry2 : HistoryEntry) : Order.Order {
      Int.compare(entry2.datePaid, entry1.datePaid);
    };
  };

  type EntryId = Text;
  type Entries = Map.Map<EntryId, Entry>;
  type HistoryEntries = Map.Map<EntryId, HistoryEntry>;

  // Kept for stable variable upgrade compatibility -- no longer used for auth
  let accessControlState = AccessControl.initState();

  public type UserProfile = { name : Text };
  let userProfiles = Map.empty<Principal, UserProfile>();

  // Store entries per user (caller principal)
  let userEntries = Map.empty<Principal, Entries>();
  let userHistoryEntries = Map.empty<Principal, HistoryEntries>();

  // Simple auth: only reject anonymous callers
  func requireAuth(caller : Principal) {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
  };

  // Stub: kept for frontend compatibility, does nothing
  public shared func _initializeAccessControlWithSecret(_secret : Text) : async () {
    ignore accessControlState;
    ignore userProfiles;
  };

  public query func getCallerUserRole() : async Text { "user" };
  public query func isCallerAdmin() : async Bool { false };

  public query ({ caller }) func getEntries() : async [Entry] {
    requireAuth(caller);
    let entries = getEntriesForCaller(caller);
    let entriesArray = entries.values().toArray();
    entriesArray.sort<Entry>();
  };

  public shared ({ caller }) func createEntry(name : Text, mobileNumber : Text, amount : Nat, commission : Nat, advance : Nat) : async Text {
    requireAuth(caller);
    let id = Time.now().toText();
    let dateCreated = Time.now();
    let totalAmount = commission + amount;
    let entry : Entry = {
      id;
      name;
      mobileNumber;
      amount;
      commission;
      totalAmount;
      paid = false;
      dateCreated;
      advance;
    };
    let currentEntries = getEntriesForCaller(caller);
    currentEntries.add(id, entry);
    id;
  };

  public shared ({ caller }) func updateEntry(id : Text, name : Text, mobileNumber : Text, amount : Nat, commission : Nat, paid : Bool, advance : Nat) : async () {
    requireAuth(caller);
    let entries = getEntriesForCaller(caller);
    let entry = switch (entries.get(id)) {
      case (null) { Runtime.trap("Entry not found") };
      case (?entry) { entry };
    };
    entries.add(id, {
      entry with
      name;
      mobileNumber;
      amount;
      commission;
      totalAmount = commission + amount;
      paid;
      advance;
    });
  };

  public shared ({ caller }) func deleteEntry(id : Text) : async () {
    requireAuth(caller);
    let entries = getEntriesForCaller(caller);
    if (not entries.containsKey(id)) {
      Runtime.trap("Entry not found");
    };
    entries.remove(id);
  };

  public shared ({ caller }) func moveEntryToHistory(id : Text) : async () {
    requireAuth(caller);
    let entries = getEntriesForCaller(caller);
    let entry = switch (entries.get(id)) {
      case (null) { Runtime.trap("Entry not found") };
      case (?entry) { entry };
    };
    let historyEntries = getHistoryEntriesForCaller(caller);
    let historyEntry : HistoryEntry = {
      entry with
      paid = true;
      datePaid = Time.now();
    };
    historyEntries.add(id, historyEntry);
    entries.remove(id);
  };

  public query ({ caller }) func getHistoryEntries() : async [HistoryEntry] {
    requireAuth(caller);
    let historyEntries = getHistoryEntriesForCaller(caller);
    let entriesArray = historyEntries.values().toArray();
    entriesArray.sort<HistoryEntry>();
  };

  public shared ({ caller }) func deleteHistoryEntry(id : Text) : async () {
    requireAuth(caller);
    let historyEntries = getHistoryEntriesForCaller(caller);
    if (not historyEntries.containsKey(id)) {
      Runtime.trap("Entry not found");
    };
    historyEntries.remove(id);
  };

  func getEntriesForCaller(caller : Principal) : Entries {
    switch (userEntries.get(caller)) {
      case (?entries) { entries };
      case (null) {
        let newEntries = Map.empty<EntryId, Entry>();
        userEntries.add(caller, newEntries);
        newEntries;
      };
    };
  };

  func getHistoryEntriesForCaller(caller : Principal) : HistoryEntries {
    switch (userHistoryEntries.get(caller)) {
      case (?entries) { entries };
      case (null) {
        let newEntries = Map.empty<EntryId, HistoryEntry>();
        userHistoryEntries.add(caller, newEntries);
        newEntries;
      };
    };
  };
};
