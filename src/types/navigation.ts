export type RootStackParamList = {
  Home: undefined;
  OpenApp: undefined;
  MeasureRoof: undefined;
  Quote: undefined;
  Signup: undefined;
  Login: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}