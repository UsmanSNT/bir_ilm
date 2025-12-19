-- 1. Avval mavjud constraint'ni o'chirish
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- 2. Yangi constraint yaratish (user, admin, super_admin qabul qiladi)
ALTER TABLE users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('user', 'admin', 'super_admin'));

-- 3. Endi rolini o'zgartirish
UPDATE users 
SET role = 'super_admin' 
WHERE email = 'avrangzebabdujalilov@gmail.com';

-- 4. Tekshirish
SELECT id, username, email, role 
FROM users 
WHERE email = 'avrangzebabdujalilov@gmail.com';

