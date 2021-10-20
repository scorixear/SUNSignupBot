function registerInteractions() {
  Reflect.construct(require('./../interactions/signup.js').default.Signup, []);
}

export default {registerInteractions};
