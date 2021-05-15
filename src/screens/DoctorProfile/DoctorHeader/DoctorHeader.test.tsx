import React, { FC } from 'react';
import { render } from '@testing-library/react-native';
import DoctorHeader from './DoctorHeader';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../i18n';

const wrapper: FC = ({ children }) => {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
};
describe('Button component test', () => {
  it('renders correctly', () => {
    const { toJSON } = render(
      <DoctorHeader
        title="Title"
        subtitle="Subtitle"
        imagURL="http://www.test.com/image.jpg"
      />,
      { wrapper },
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
