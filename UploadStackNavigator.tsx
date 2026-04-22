import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import UploadScreen from "@/screens/UploadScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type UploadStackParamList = {
  Upload: undefined;
};

const Stack = createNativeStackNavigator<UploadStackParamList>();

export default function UploadStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Upload"
        component={UploadScreen}
        options={{
          headerTitle: "Upload Content",
        }}
      />
    </Stack.Navigator>
  );
}
