import colors from 'colors';
import { User } from '../app/modules/user/user.model';
import config from '../config';
import { USER_ROLES } from '../enums/user';
import { logger } from '../shared/logger';
import { TUser } from '../app/modules/user/user.interface';

const superUser: TUser = {
  name: 'Abdullah',
  role: USER_ROLES.SUPER_ADMIN,
  email: config.super_admin.email!,
  password: config.super_admin.password!,
  verified: true,
  address: 'N/A',
  phoneNumber: 'N/A',
  country: 'N/A',
  gender: 'Male',
  subscription: true,
  isAllFieldsFilled: true,
  dob: new Date('01-01-2000'),
  
  status: 'active',
};

const seedSuperAdmin = async () => {
  const isExistSuperAdmin = await User.findOne({
    role: USER_ROLES.SUPER_ADMIN,
  });

  if (!isExistSuperAdmin) {
    await User.create(superUser);
    logger.info(colors.green('✔ Super admin created successfully!'));
  }
};

export default seedSuperAdmin;
