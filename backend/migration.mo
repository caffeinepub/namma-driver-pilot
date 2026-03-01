import Set "mo:core/Set";

module {
  type OldActor = {
    adminPrincipalSet : Set.Set<Text>;
    OWNER_ADMIN_PRINCIPAL : Text;
    // other old actor fields
  };

  type NewActor = {
    adminPrincipalSet : Set.Set<Text>;
    // other new actor fields
  };

  public func run(old : OldActor) : NewActor {
    let newAdminPrincipalSet = Set.fromArray([
      "6ngnc-ph7ou-g23nw-z2zbr-czprs-ohpe6-2wolp-eeo7o-c32lo-deiso-yqe",
      "g3c77-j7yp6-ydsrd-2zp2q-vajyd-4ymec-tydvo-kcxwl-s7reg-37yws-eae",
    ]);

    { adminPrincipalSet = newAdminPrincipalSet };
  };
};
