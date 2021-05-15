import React, { FC } from 'react';
import { render } from '@testing-library/react-native';
import ContactInfo from './ContactInfo';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../i18n';

const wrapper: FC = ({ children }) => {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
};
describe('Button component test', () => {
  it('renders correctly', () => {
    const { toJSON } = render(
      <ContactInfo
        address="Address"
        email="email@test.com"
        phone="+90 545 693 9297"
      />,
      { wrapper },
    );

    expect(toJSON()).toMatchSnapshot();
  });
});
