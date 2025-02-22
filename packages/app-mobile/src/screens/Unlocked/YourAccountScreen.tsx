import { Screen } from "@components";
import { useKeyringHasMnemonic } from "@coral-xyz/recoil";
import { SettingsList } from "@screens/Unlocked/Settings/components/SettingsMenuList";

export function YourAccountScreen({ navigation }) {
  const hasMnemonic = useKeyringHasMnemonic();

  const menuItems = {
    "Change Password": {
      onPress: () => navigation.push("change-password"),
    },
    ...(hasMnemonic
      ? {
          "Show Secret Recovery Phrase": {
            onPress: () => navigation.push("show-secret-phrase-warning"),
          },
        }
      : {}),
    Logout: {
      onPress: () => navigation.push("reset-warning"),
    },
  };

  return (
    <Screen>
      <SettingsList menuItems={menuItems} />
    </Screen>
  );
}
