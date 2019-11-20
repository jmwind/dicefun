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
  call,
  spring,
  startClock,
  stopClock,
  clockRunning,
  cond,
  add,
  sub,
  min,
  multiply,
  eq,
  set,
  block,
} = Animated;

const CIRCLE_SIZE = 100;
const STATUS_BAR_HEIGHT = 100;
const DROPZONE_SIZE = CIRCLE_SIZE + 7;
const { width, height } = Dimensions.get("window");

const createDropZone = (this_id, dx, dy) => {
  return {
    id: this_id, 
    x: (dx - DROPZONE_SIZE / 2),
    y: dy,
    cx: dx - (CIRCLE_SIZE / 2),
    cy: dy + (DROPZONE_SIZE / 2) - (CIRCLE_SIZE / 2)  
  }
}

const third = (width / 3);
const drops = [  
  createDropZone(3, third * 2, 125),      
  createDropZone(5, third, 400),
  createDropZone(1, third, 125), 
  createDropZone(4, third * 2, 400), 
];
const offsetX = new Value(drops[0].cx);
const offsetY = new Value(drops[0].cy);

const logSnapPoint = (value, points) => {
  const __diffPoint = (p) => Math.abs(value - p);
  const __deltas = points.map(p => __diffPoint(p));
  const __minDelta = Math.min(...__deltas);
  console.log("minDelta: " + __minDelta);
  console.log("snap point for: " + value + " => " + points.reduce(
    (acc, p) => {
      if(__diffPoint(p) == __minDelta) {
        return p;
      } else {
        return acc;
      }
    },
    0
  ));
}

const snapPoint = (value, points) => {
  const diffPoint = (p) => abs(sub(value, p));
  const deltas = points.map(p => diffPoint(p));
  const minDelta = min(...deltas);

  const __diffPoint = (p) => Math.abs(value - p);
  const __deltas = points.map(p => __diffPoint(p));
  const __minDelta = Math.min(...__deltas);  
  return points.reduce(
    (acc, p) => cond(eq(diffPoint(p), minDelta), p, acc),
    new Value()
  );
};

const withOffset = (value, gestureState, offset, velocity, snapPoints) => {
  const clock = new Clock();
  const state = {
    finished: new Value(0), 
    velocity: new Value(0), 
    position: new Value(0), 
    time: new Value(0) 
  }
  const config = {
    damping: 20,
    mass: 1,
    stiffness: 200,
    overshootClamping: false,
    restSpeedThreshold: 0.001,
    restDisplacementThreshold: 0.001,
    toValue: new Value(0),
  }

  return block([
    cond(eq(gestureState, State.BEGAN), [
      set(offset, state.position),
      stopClock(clock)
    ]),
    // step 1: At the end of the gesture
    cond(eq(gestureState, State.END),
      // true
      [
        // Start animation at the end
        // TODO: add check that spring isn't in progress or it messes up the offset calculation
        cond(and(not(clockRunning(clock)), not(state.finished)),
          // true
          [
            set(state.time, 0),
            set(state.velocity, velocity),       
            set(config.toValue, snapPoint(state.position, snapPoints)),
            startClock(clock),            
          ]
        ),
        spring(clock, state, config),
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
 
  const translateX = 
    withOffset(translationX, state, offsetX, velocityX, drops.map(d => d.cx));
  const translateY = 
    withOffset(translationY, state, offsetY, velocityY, drops.map(d => d.cy));

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
          {
            drops.map((d) => (
              <View key={d.id} style={[styles.drop, {left: d.x, top: d.y}]} />
            ))
          }          
          <PanGestureHandler
              maxPointers={1}
              onGestureEvent={onGestureEvent}
              onHandlerStateChange={onGestureEvent}>
            <Animated.View style={[
                styles.ball,
                {left: 0, top: 0},
                {transform: [{translateX},{translateY}]}
              ]}
            />
          </PanGestureHandler>
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
    color: '#828282',
  },
  ball: {
    position: 'absolute',    
    backgroundColor: '#FF515E',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    zIndex: 10,
    borderRadius: 7,
    borderColor: '#000',
  },
  drop: {
    position: 'absolute',
    backgroundColor: '#1E1E1E',    
    borderRadius: 5,
    width: DROPZONE_SIZE,
    height: DROPZONE_SIZE,
    borderColor: '#000',
  },
});
