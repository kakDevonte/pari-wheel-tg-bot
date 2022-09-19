import axios from "axios";

const instance = axios.create({
  baseURL: "http://85.143.175.133:5000/api/",
});

export const referralAPI = {
  getReferrals(id) {
    return instance.get(`referrals/${id}`);
  },
  addReferral(referral) {
    return instance.post(`referrals/`, referral);
  },
  updateReferral(referral) {
    return instance.put(`referrals/`, referral);
  },
};
