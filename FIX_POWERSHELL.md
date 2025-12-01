# PowerShell Execution Policy Muammosini Hal Qilish

## Muammo
PowerShell'da npm buyruqlari ishlamayapti, chunki scriptlarni ishga tushirishga ruxsat berilmagan.

## Yechim 1: CMD orqali ishga tushirish (Tezkor)
Har safar `cmd /c` dan foydalaning:
```bash
cmd /c npm start
cmd /c npm install
```

## Yechim 2: PowerShell Policy'ni o'zgartirish (Doimiy)

### Qadam 1: PowerShell'ni Administrator sifatida oching
1. Start menudasidan "PowerShell" ni qidiring
2. O'ng tugma bosing va "Run as administrator" ni tanlang

### Qadam 2: Quyidagi buyruqni bajaring:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Qadam 3: "Y" tugmasini bosing (ha deb javob bering)

### Qadam 4: PowerShell'ni yopib, qayta oching

Endi `npm start` to'g'ridan-to'g'ri ishlaydi!

## Tekshirish
```powershell
Get-ExecutionPolicy
```
Bu `RemoteSigned` yoki `Bypass` ko'rsatishi kerak.

