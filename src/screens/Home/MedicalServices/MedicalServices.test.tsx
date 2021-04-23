import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import MedicalServices from './MedicalServices';
import { ReactTestInstance } from 'react-test-renderer';
import { StyleSheet } from 'react-native';

describe('Button component test', () => {
  it('renders correctly', () => {
    const { toJSON } = render(<MedicalServices />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('overrides styles', () => {
    const { container } = render(<MedicalServices style={{ padding: 50 }} />);
    const baseView = StyleSheet.flatten(
      (container.children[0] as ReactTestInstance).props.style,
    );
    expect(baseView.padding).toBe(50);
  });

  it('invokes a function when close icon is pressed', () => {
    const mockFn = jest.fn();
    const { getByTestId } = render(<MedicalServices onPress={mockFn} />);
    const btn = getByTestId('search-button');
    fireEvent.press(btn);
    expect(mockFn).toBeCalled();
  });
});
