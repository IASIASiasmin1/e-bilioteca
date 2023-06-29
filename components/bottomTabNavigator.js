import React, { Component } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Transaction from "../screens/transaction";
import Search from "../screens/search";
import Ionicons from "react-native-vector-icons/Ionicons";

const Tab = createBottomTabNavigator();

export default class BottomTabNavigator extends Component {
  render() {
    return (
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              var iconName;
              if (route.name == "Transação") {
                iconName = "book";
              } else {
                iconName = "search";
              }
              return <Ionicons name={iconName} size={size} color={color} />;
            },
          })}
          tabBarOptions={{
            activeTintColor: "#FFFFFF",
            inactiveTintColor: "#000000",
            style: { height: 130, backgroundColor: "#5653D4" },
            labelStyle: { fontSize: 20 },
            labelPosition: "beside-icon",
            tabStyle: {
              marginTop: 25,
              marginLeft: 10,
              marginRight: 10,
              borderRadius: 30,
              borderWidth: 2,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#5653D4",
            },
          }}
        >
          <Tab.Screen name="Transação" component={Transaction}></Tab.Screen>
          <Tab.Screen name="Pesquisa" component={Search}></Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>
    );
  }
}
