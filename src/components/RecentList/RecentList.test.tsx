import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import RecentList from './RecentList';

const ITEMS = [
  { id: '1', url: 'https://images2.imgbox.com/f7/bb/7HJeSokt_o.png' },
  { id: '2', url: 'https://images2.imgbox.com/5d/c9/sqb7cQMS_o.png' },
  { id: '3', url: 'https://images2.imgbox.com/19/80/QQZwXNbP_o.png' },
  { id: '4', url: 'https://images2.imgbox.com/4b/fe/k8H0shP2_o.png' },
  { id: '5', url: 'https://imgbox.com/k8H0shP2' },
  { id: '6', url: 'https://imgbox.com/lRBBYcMj' },
  { id: '7', url: 'https://imgbox.com/h79FIvf2' },
];

describe('Button component test', () => {
  it('renders correctly with image list', () => {
    const { toJSON } = render(<RecentList imageList={ITEMS} />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders correctly with empty list', () => {
    const { toJSON } = render(<RecentList imageList={[]} />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('invokes a function when extra button is pressed', () => {
    const mockFn = jest.fn();
    const { getByTestId } = render(
      <RecentList imageList={ITEMS} onExtraPress={mockFn} />,
    );
    const btn = getByTestId('Button');
    fireEvent.press(btn);
    expect(mockFn).toBeCalled();
  });

  it('invokes a function when a doctor pressed', () => {
    const mockFn = jest.fn();
    const { getAllByTestId } = render(
      <RecentList imageList={ITEMS} onPress={mockFn} />,
    );
    const avatar = getAllByTestId('avatar');
    fireEvent.press(avatar[0]);
    expect(mockFn).toBeCalledWith('1');
  });

  //   it('renders primary small button', () => {
  //     const { getByTestId } = render(
  //       <Button theme="primary" size="small">
  //         Hello
  //       </Button>,
  //     );
  //     const btn = getByTestId('Button');
  //     const style = StyleSheet.flatten(btn.props.style);
  //     expect(style.backgroundColor).toBe(colors.primary);
  //     expect(style.padding).toBe(spacing.small1);
  //   });

  //   it('renders secondary medium small button', () => {
  //     const { getByTestId } = render(
  //       <Button theme="secondary" size="medium">
  //         Hello
  //       </Button>,
  //     );
  //     const btn = getByTestId('Button');
  //     const style = StyleSheet.flatten(btn.props.style);
  //     expect(style.backgroundColor).toBe(colors.white);
  //     expect(style.padding).toBe(spacing.small3);
  //   });

  //   it('renders grey big small button', () => {
  //     const { getByTestId } = render(
  //       <Button theme="grey" size="big">
  //         Hello
  //       </Button>,
  //     );
  //     const btn = getByTestId('Button');
  //     const style = StyleSheet.flatten(btn.props.style);
  //     expect(style.backgroundColor).toBe(colors.light);
  //     expect(style.padding).toBe(spacing.medium1);
  //   });

  //   it('overrides styles', () => {
  //     const { getByTestId } = render(
  //       <Button style={{ borderRadius: 0 }}>Hello</Button>,
  //     );
  //     const btn = getByTestId('Button');
  //     const style = StyleSheet.flatten(btn.props.style);
  //     expect(style.borderRadius).toBe(0);
  //   });

  //   it('invokes a function when pressed', () => {
  //     const mockFn = jest.fn();
  //     const { getByText } = render(<Button onPress={mockFn}>BUTTON</Button>);
  //     const btn = getByText('BUTTON');
  //     fireEvent.press(btn);
  //     expect(mockFn).toBeCalled();
  //   });
});
