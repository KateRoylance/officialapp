import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SocialScreen from "@/screens/SocialScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type SocialStackParamList = {
  Social: undefined;
};

const Stack = createNativeStackNavigator<SocialStackParamList>();

export default function SocialStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Social"
        component={SocialScreen}
        options={{
          headerTitle: "Social Activity",
        }}
      />
    </Stack.Navigator>
  );
}
