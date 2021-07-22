/* Copyright Contributors to the Open Cluster Management project */
import * as _ from 'lodash';
import { useRef } from "react";

export const useDeepCompareMemoize = <R = any>(value: R): R => {
    const ref = useRef<R>(value);
  
    if (!_.isEqual(value, ref.current)) {
      ref.current = value;
    }
  
    return ref.current;
};