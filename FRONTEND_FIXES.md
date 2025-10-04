# Frontend API Integration Fixes

## 🚨 Current Issues Causing 400 Validation Errors

### 1. **Missing Required Fields**
The backend requires these fields that are missing from the frontend form:

#### **Required Fields Missing:**
- `firstName` - First name (required)
- `lastName` - Last name (required)
- `email` - Email address (required)
- `phone` - Phone number in format +234XXXXXXXXXX (required)
- `aboutBusiness` - Description of business, minimum 10 characters (required)
- `businessName` - Name of the business (required)
- `businessType` - Type of business (required)
- `businessAddress` - Business address, minimum 10 characters (required)
- `yearsInBusiness` - Years in business (required)
- `expectations` - What you expect from the program, minimum 10 characters (required)

#### **Optional Fields:**
- `cacNo` - CAC registration number (optional)
- `kasedaCertNo` - KASEDA certificate number (optional)
- `additionalInfo` - Additional information (optional)

### 2. **Field Name Corrections**
- `Additional Information` → `additionalInfo`
- Remove `program?` field (not expected by backend)

### 3. **Validation Rules**

#### **Phone Number Format:**
- Must be: `+234XXXXXXXXXX` (Nigerian format)
- Example: `+2348123456789`

#### **Business Type Options:**
- `retail`
- `manufacturing`
- `services`
- `technology`
- `healthcare`
- `education`
- `food`
- `agriculture`
- `other`

#### **Years in Business Options:**
- `0-1`
- `2-3`
- `4-5`
- `6-10`
- `10+`

#### **Availability Options:**
- `immediately`
- `1-month`
- `2-3-months`
- `3-6-months`
- `flexible`

#### **Preferred Time Options:**
- `morning`
- `afternoon`
- `evening`
- `weekend`
- `flexible`

### 4. **Minimum Length Requirements**
- `aboutBusiness`: minimum 10 characters
- `businessAddress`: minimum 10 characters
- `expectations`: minimum 10 characters

## 📝 Correct API Request Format

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "+2348123456789",
  "aboutBusiness": "We provide digital marketing services for small businesses in Lagos",
  "businessName": "Digital Solutions Ltd",
  "businessType": "services",
  "businessAddress": "123 Victoria Island, Lagos, Nigeria",
  "yearsInBusiness": "2-3",
  "expectations": "I want to learn about scaling my business and accessing funding",
  "availability": "1-month",
  "preferredTime": "morning",
  "additionalInfo": "Any additional information here",
  "cacNo": "RC123456789",
  "kasedaCertNo": "KAS123456"
}
```

## 🔧 Frontend Form Updates Needed

1. **Add missing required fields** to the form
2. **Update field names** to match backend expectations
3. **Add proper validation** for minimum lengths
4. **Update phone number input** to enforce +234 format
5. **Add dropdowns** for businessType, yearsInBusiness, availability, preferredTime
6. **Remove** the `program?` field

## 🧪 Test the API

**Endpoint:** `POST https://msmeclinicbackend.onrender.com/api/register`

**Headers:**
```
Content-Type: application/json
```

**Test with curl:**
```bash
curl -X POST https://msmeclinicbackend.onrender.com/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "phone": "+2348123456789",
    "aboutBusiness": "We provide digital marketing services for small businesses",
    "businessName": "Test Business",
    "businessType": "services",
    "businessAddress": "123 Test Street, Lagos, Nigeria",
    "yearsInBusiness": "2-3",
    "expectations": "I want to learn about business scaling and funding",
    "availability": "1-month",
    "preferredTime": "morning"
  }'
```

## ✅ Expected Success Response

```json
{
  "success": true,
  "message": "Registration successful - You are confirmed to attend!",
  "data": {
    "registrationId": "REG-2024-001",
    "participantId": "PART-2024-001",
    "email": "test@example.com",
    "status": "confirmed_to_attend"
  }
}
```
