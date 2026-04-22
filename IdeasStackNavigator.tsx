import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import IdeasScreen from "@/screens/IdeasScreen";
import { HeaderTitle } from "@/components/HeaderTitle";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type IdeasStackParamList = {
  Ideas: undefined;
};

const Stack = createNativeStackNavigator<IdeasStackParamList>();

export default function IdeasStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Ideas"
        component={IdeasScreen}
        options={{
          headerTitle: () => <HeaderTitle title="Content Ideas" />,
        }}
      />
    </Stack.Navigator>
  );
}
