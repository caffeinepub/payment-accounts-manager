import Time "mo:core/Time";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";

import MixinAuthorization "authorization/MixinAuthorization";
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
  };

  module Entry {
    public func compare(entry1 : Entry, entry2 : Entry) : Order.Order {
      Int.compare(entry2.dateCreated, entry1.dateCreated);
    };
  };

  type EntryId = Text;
  type Entries = Map.Map<EntryId, Entry>;

  // Initialize the access control state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User profiles
  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  // Store entries per user (caller principal)
  let userEntries = Map.empty<Principal, Entries>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func createEntry(name : Text, mobileNumber : Text, amount : Nat, commission : Nat) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create entries");
    };

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
    };

    let currentEntries = getEntriesForCaller(caller);
    currentEntries.add(id, entry);

    id;
  };

  public query ({ caller }) func getEntries() : async [Entry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view entries");
    };

    let entries = getEntriesForCaller(caller);
    let entriesArray = entries.values().toArray();
    entriesArray.sort();
  };

  public shared ({ caller }) func updateEntry(id : Text, name : Text, mobileNumber : Text, amount : Nat, commission : Nat, paid : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update entries");
    };

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
    });
  };

  public shared ({ caller }) func deleteEntry(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete entries");
    };

    let entries = getEntriesForCaller(caller);
    if (not entries.containsKey(id)) {
      Runtime.trap("Entry not found");
    };
    entries.remove(id);
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
};
