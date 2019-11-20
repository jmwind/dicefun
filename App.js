import React from 'react';
import { StyleSheet, Text, View, Dimensions, Platform } from 'react-native';
import Animated from 'react-native-reanimated';
import {PanGestureHandler, State, TextInput} from 'react-native-gesture-handler';

const {
  event,
  Value,
  diffClamp,
  Clock,
  lessThan,
  greaterThan,
  divide,
  diff,
  defined,
  abs,
  and,
  not,
  decay,
  startClock,
  stopClock,
  clockRunning,
  cond,
  add,
  sub,
  multiply,
  eq,
  set,
  block,
} = Animated;

const CIRCLE_SIZE = 70;
const STATUS_BAR_HEIGHT = 100;
const DROPZONE_SIZE = CIRCLE_SIZE + 50;
const { width, height } = Dimensions.get("window");
const containerWidth = width;
const containerHeight =
  height - STATUS_BAR_HEIGHT - (Platform.OS === "ios" ? 44 : 52);
const offsetX = new Value(0);
const offsetY = new Value(0);

const withOffset = (value, gestureState, offset, velocity) => {
  const clock = new Clock();
  const state = {
    finished: new Value(0), 
    velocity: new Value(0), 
    position: new Value(0), 
    time: new Value(0) 
  }
  const config = {
    deceleration: 0.990
  }
  return block([
    // step 1: At the end of the gesture
    cond(eq(gestureState, State.END),
      // true
      [
        // Start animation at the end
        cond(and(not(clockRunning(clock)), not(state.finished)),
          // true
          [
            set(state.time, 0),
            set(state.velocity, velocity),
            startClock(clock),            
          ]
        ),
        decay(clock, state, config),
        cond(state.finished,
          [
            set(offset, state.position),
            stopClock(clock)
          ])
      ],
      // false, same position for next time so that the drag starts from the 
      [
        set(state.finished, 0),
        set(state.position, add(offset, value))
      ]
    ),
    state.position
  ]);    
};

export default function App() {
  const state = new Value(State.UNDETERMINED);
  const translationX = new Value(0);
  const translationY = new Value(0);
  const velocityX = new Value(0);
  const velocityY = new Value(0);
  const onGestureEvent = event([
    {
      nativeEvent: {
        state, 
        translationX,
        translationY,
        velocityX,
        velocityY
      }
    }
  ]);
  /*
  const translateX = diffClamp(
    withOffset(translationX, state), 0, containerWidth - CIRCLE_SIZE
  );
  const translateY = diffClamp(
    withOffset(translationY, state), 0, containerHeight - CIRCLE_SIZE
  );
  */
  const translateX = 
    withOffset(translationX, state, offsetX, velocityX);
  const translateY = 
    withOffset(translationY, state, offsetY, velocityY);

  return (
    <View style={styles.container}>
        <View style={styles.top_container}>
          <View style={styles.variables}>
            <Text style={styles.variables_text}>Mass: </Text>
            <TextInput style={styles.variables_text}>1</TextInput>
          </View>
          <View style={styles.variables}>
            <Text style={styles.variables_text}>Tension: </Text>
            <TextInput style={styles.variables_text}>10</TextInput>
          </View>
          <View style={styles.variables}>
            <Text style={styles.variables_text}>Damping: </Text>
            <TextInput style={styles.variables_text}>5</TextInput>
          </View>
        </View>
        <View style={styles.main_container}>
          <View style={[styles.drop]} />
          <PanGestureHandler
              maxPointers={1}
              onGestureEvent={onGestureEvent}
              onHandlerStateChange={onGestureEvent}>
            <Animated.View style={[
                styles.ball,{transform: [{translateX},{translateY}]}
              ]}
            />
          </PanGestureHandler>
          <View style={[styles.drop]} />
        </View>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    alignContent: 'stretch',
    backgroundColor: '#F5FCFF',
  },
  top_container: {
    height: STATUS_BAR_HEIGHT,
    flexGrow: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E1E1E',
  },
  main_container: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 'auto',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#424242',
  },
  variables: {
    flexDirection: 'row',
    margin: 15,
    marginTop: 60,
  },
  variables_text: {
    fontSize: 20,
    color: 'white',
  },
  ball: {
    backgroundColor: '#CE9178',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    margin: 75,
    zIndex: 10,
    borderRadius: CIRCLE_SIZE / 2,
    borderColor: '#000',
  },
  drop: {
    backgroundColor: '#1E1E1E',
    width: DROPZONE_SIZE,
    height: DROPZONE_SIZE,
    borderColor: '#000',
  },
});
