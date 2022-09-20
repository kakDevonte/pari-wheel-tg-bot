import axios from "axios";

const instance = axios.create({
  baseURL: "https://297349.simplecloud.ru/api/",
});

export const referralAPI = {
  getReferrals() {
    return instance.get(`referrals/`);
  },
  addReferral(referral) {
    return instance.post(`referrals/`, referral);
  },
  updateReferral(referral) {
    return instance.put(`referrals/`, referral);
  },
  getUser(id) {
    return instance.get(`users/${id}`);
  },
  updateUser(user) {
    return instance.put(`users/`, user);
  },
};
