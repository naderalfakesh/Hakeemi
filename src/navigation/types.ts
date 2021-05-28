export type RootParamsList = {
  Welcome: undefined;
  SignUp: undefined;
  SignIn: undefined;
  ForgotPassword: undefined;
  App: undefined;
};

export type AppStackParams = {
  Home: undefined;
  Doctors: undefined;
  DoctorProfile: { id?: string };
  ScheduleDialog: { id?: string };
  Profile: undefined;
};

export type AppStackRouteName = keyof AppStackParams;

export type ModalStackParams = {
  AppStack: undefined;
  DoctorProfileModal: AppStackParams['DoctorProfile'];
  ScheduleDialogModal: AppStackParams['ScheduleDialog'];
};

export type DoctorStackParams = {
  Doctors: AppStackParams['Doctors'];
  Profile: AppStackParams['Profile'];
  DoctorProfileModal: AppStackParams['DoctorProfile'];
};

export type DrawerStackParams = {
  HomeDrawer: undefined;
  DoctorsDrawer: undefined;
  ProfileDrawer: undefined;
};
