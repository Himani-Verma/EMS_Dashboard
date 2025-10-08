# Database Structure & Data Flow

## 🗄️ Database Collections

### 1. **Users Collection**
- **Admin**: System administrator with full access (hardcoded)
- **Other Users**: Created through registration process, approved by admin

### 2. **Services Collection** (NEW - Proper Services Table)
- **Main Services**: Food Testing, Water Testing, Environmental Testing, etc.
- **Sub Services**: Detailed breakdown of each main service
- **Pricing**: Base price, unit, currency for each service
- **Requirements**: What's needed for each service
- **Duration**: Estimated completion time

### 3. **Visitors Collection** (Main Table)
- **Basic Info**: name, email, phone, organization, region
- **Service Info**: service, subservice, enquiryDetails
- **Quotation Details**: items, pricing, status, validUntil
- **Source**: chatbot, enquiry, email, calls, website
- **Status**: enquiry_required, assigned, converted, etc.
- **Assignment**: assignedAgent, salesExecutive, customerExecutive
- **Tracking**: lastInteractionAt, pipelineHistory, assignmentHistory

### 3. **Enquiries Collection**
- **Linked to Visitors**: visitorId (required)
- **Service Details**: service, subservice, enquiryDetails
- **Channel**: enquiry_form, chatbot, email, calls
- **Status**: new, open, pending, assigned, converted, won
- **Assignment**: assignedTo, assignedAt, notes

### 4. **Executive Services Collection** (Assignment Table)
- **Executive Assignment**: Links executives to specific services
- **Service Assignment**: Which services each executive handles
- **Assignment History**: Track who assigned what and when

### 5. **Chat Messages Collection**
- **Linked to Visitors**: visitorId (required)
- **Session Info**: sessionId, sender (user/bot/agent)
- **Message**: text, messageType, metadata
- **Tracking**: isRead, readAt

## 🔄 Data Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Enquiry Form  │───▶│  Enquiry Table │───▶│ Visitor Table  │
│                 │    │                 │    │                 │
│ - Name          │    │ - visitorId     │    │ - Basic Info    │
│ - Email         │    │ - service       │    │ - Service Info  │
│ - Phone         │    │ - details       │    │ - Quotation     │
│ - Service       │    │ - status        │    │ - Source: enquiry│
│ - Details       │    │ - channel       │    │ - Status        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                         │
                                                         ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Chatbot       │───▶│ Chat Messages    │───▶│ Visitor Table   │
│                 │    │                 │    │                 │
│ - User messages │    │ - visitorId     │    │ - Chat History  │
│ - Bot responses │    │ - sessionId     │    │ - Source: chatbot│
│ - Agent chats   │    │ - sender        │    │ - Last Interaction│
│                 │    │ - text          │    │ - Pipeline History│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📊 Key Relationships

### **Visitor → Enquiries**
- One visitor can have multiple enquiries
- Each enquiry has a `visitorId` reference
- Enquiry data populates visitor's service details

### **Visitor → Chat Messages**
- One visitor can have multiple chat sessions
- Each message has a `visitorId` reference
- Chat history tracks all interactions

### **User → Visitors (Assignment)**
- Users can be assigned to visitors as:
  - `assignedAgent` (Customer Executive)
  - `salesExecutive` (Sales Executive)
  - `customerExecutive` (Customer Executive)

## 🎯 Data Sources

### **From Enquiry Form:**
1. User fills enquiry form
2. Data goes to `Enquiry` table (channel: "enquiry_form")
3. Visitor record created/updated in `Visitor` table
4. Source determined by how they found the form (website, chatbot, calls, emails)

### **From Chatbot:**
1. User chats with bot
2. Messages stored in `ChatMessage` table
3. Visitor record created/updated in `Visitor` table
4. Source marked as "chatbot"

### **From Calls:**
1. Phone call received
2. Visitor record created in `Visitor` table
3. Source marked as "calls"

### **From Emails:**
1. Email enquiry received
2. Visitor record created in `Visitor` table
3. Source marked as "emails"

### **From Website:**
1. Direct website visit
2. Visitor record created in `Visitor` table
3. Source marked as "website"

### **From Admin Panel:**
1. Admin can create/update visitors
2. Assign agents and executives
3. Update status and add notes
4. Track pipeline history

## 🔧 Database Indexes

- **Users**: email, role, isActive
- **Visitors**: email, phone, status, source, assignedAgent, createdAt
- **Enquiries**: visitorId, status, assignedTo, createdAt
- **Chat Messages**: visitorId, sessionId, createdAt

## 🚀 Login Credentials

- **Admin**: admin@envirocarelabs.com / admin123
- **Customer Executive**: customer.executive@envirocarelabs.com / customer123
- **Sales Executive**: sales.executive@envirocarelabs.com / sales123

## 📝 Notes

- **No fake data**: All data comes from real user interactions
- **Enquiry form**: Creates both enquiry and visitor records
- **Chatbot**: Creates both chat messages and visitor records
- **Proper relationships**: All data linked via visitorId
- **Source tracking**: Each visitor knows how they came in
- **Assignment tracking**: Full history of agent assignments
- **Pipeline tracking**: Complete status change history
