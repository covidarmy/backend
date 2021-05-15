const Mixpanel = require("mixpanel");

const getAnalytics = () => {
  if (!global.mixpanel)
    global.mixpanel = Mixpanel.init(process.env.ANALYTICS_KEY);
  return global.mixpanel;
};

module.export = getAnalytics;
