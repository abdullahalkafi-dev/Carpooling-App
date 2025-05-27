import colors from "colors";
import { User } from "../app/modules/user/user.model";
import config from "../config";
import { logger } from "../shared/logger";
import { TUser } from "../app/modules/user/user.interface";
import { USER_ROLES } from "../app/modules/user/user.constant";

const superUser: TUser = {
  firstName: "Abdullah",
  lastName: "Al-Mansoori",
  role: USER_ROLES.ADMIN,
  email: config.super_admin.email!,
  password: config.super_admin.password!,
  verified: true,
  phoneNumber: "N/A",

  address: [
    {
      title: "Home",
      street: "123 Main St",
      apartmentNumber: "Apt 4B",
      city: "Dhaka",
      state: "Dhaka",
      postalCode: "1212",
    },
  ],

  status: "active",  
};

const seedSuperAdmin = async () => {
  const isExistSuperAdmin = await User.findOne({
    role: USER_ROLES.ADMIN,
  });

  if (!isExistSuperAdmin) {
    await User.create(superUser);
    logger.info(colors.green("✔ Super admin created successfully!"));
  }
};

export default seedSuperAdmin;
