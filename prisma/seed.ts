import { PrismaClient, UserRole, LifecycleStage, LeadStatus, LeadSource, ServiceInterest, DealStage, ActivityType, ActivityOutcome, TaskPriority, TaskStatus, MeetingStatus, AuditAction } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding 7BLOCKS CRM Database ---');

  // Clean existing data
  await prisma.dealTag.deleteMany();
  await prisma.companyTag.deleteMany();
  await prisma.contactTag.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.task.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.emailLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.company.deleteMany();
  await prisma.importBatch.deleteMany();
  await prisma.user.deleteMany();

  console.log('Existing tables cleared.');

  // 1. Create Users
  const passwordHash = await bcrypt.hash('7Blocks@2026!', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Krish Khinchi',
      email: 'admin@7blocks.com',
      passwordHash,
      role: UserRole.ADMIN,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      isActive: true,
      lastLoginAt: new Date(),
    }
  });

  const manager = await prisma.user.create({
    data: {
      name: 'Rohan Pandey',
      email: 'rohan.pandey@7block.in',
      passwordHash,
      role: UserRole.MANAGER,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      isActive: true,
      lastLoginAt: new Date(),
    }
  });

  const rep1 = await prisma.user.create({
    data: {
      name: 'Aarav Patel',
      email: 'aarav@7blocks.com',
      passwordHash,
      role: UserRole.SALES_REP,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      isActive: true,
      lastLoginAt: new Date(),
    }
  });

  const rep2 = await prisma.user.create({
    data: {
      name: 'Priya Sharma',
      email: 'priya@7blocks.com',
      passwordHash,
      role: UserRole.SALES_REP,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      isActive: true,
      lastLoginAt: new Date(),
    }
  });

  console.log('Created Users: Admin, Manager, and 2 Sales Reps.');

  // 2. Create Tags
  const tagData = [
    { name: 'Hot Lead', color: '#ef4444' },
    { name: 'Website Needed', color: '#f59e0b' },
    { name: 'Website Update', color: '#3b82f6' },
    { name: 'Gym / Fitness', color: '#10b981' },
    { name: 'Decision Maker', color: '#8b5cf6' },
    { name: 'High Value', color: '#ec4899' },
    { name: 'Demo Sent', color: '#06b6d4' },
    { name: 'Mumbai', color: '#64748b' },
    { name: 'Ahmedabad', color: '#64748b' },
    { name: 'Follow Up Required', color: '#f97316' }
  ];

  const tags: Record<string, any> = {};
  for (const t of tagData) {
    tags[t.name] = await prisma.tag.create({ data: t });
  }

  // 3. Create Companies (Based on 7Blocks Core & Indian Fitness Market)
  const companiesData = [
    {
      name: "Gold's Gym Powai",
      website: "https://goldsgym.in/our-gyms/gold-s-gym-mumbai-powai/",
      domain: "goldsgym.in",
      industry: "Fitness & Wellness",
      size: "50-200",
      city: "Mumbai",
      state: "Maharashtra",
      address: "Hiranandani Gardens, Powai, Mumbai",
      ownerId: rep1.id
    },
    {
      name: "Cult Gym Ghatkopar",
      website: "https://www.cult.fit",
      domain: "cult.fit",
      industry: "Health, Fitness & Tech",
      size: "500+",
      city: "Mumbai",
      state: "Maharashtra",
      address: "R City Mall, LBS Marg, Ghatkopar West",
      ownerId: rep2.id
    },
    {
      name: "48 Fitness",
      website: "https://www.48fitness.in",
      domain: "48fitness.in",
      industry: "Luxury Gym",
      size: "20-50",
      city: "Mumbai",
      state: "Maharashtra",
      address: "Crystal Point Mall, Andheri West",
      ownerId: rep1.id
    },
    {
      name: "Fun And Fit Gym",
      website: "https://funandfit.in",
      domain: "funandfit.in",
      industry: "Fitness & Training",
      size: "10-20",
      city: "Thane",
      state: "Maharashtra",
      address: "Ghodbunder Road, Thane",
      ownerId: rep2.id
    },
    {
      name: "MMA Matrix Gym",
      website: "http://www.mmamatrix.org",
      domain: "mmamatrix.org",
      industry: "Martial Arts & Fitness",
      size: "20-50",
      city: "Mumbai",
      state: "Maharashtra",
      address: "Bandra West, Mumbai",
      ownerId: manager.id
    },
    {
      name: "Adiyash Gym",
      website: "https://www.adiyashgym.in",
      domain: "adiyashgym.in",
      industry: "Strength & Conditioning",
      size: "5-15",
      city: "Ahmedabad",
      state: "Gujarat",
      address: "SG Highway, Ahmedabad",
      ownerId: rep1.id
    },
    {
      name: "Leo Fitness Studio",
      website: "http://www.leofitness.in",
      domain: "leofitness.in",
      industry: "CrossFit & Kickboxing",
      size: "10-25",
      city: "Mumbai",
      state: "Maharashtra",
      address: "Chembur, Mumbai",
      ownerId: rep2.id
    },
    {
      name: "Shanky Fitness",
      website: "https://www.shankyfitness.in",
      domain: "shankyfitness.in",
      industry: "Commercial Fitness",
      size: "10-20",
      city: "Pune",
      state: "Maharashtra",
      address: "Koregaon Park, Pune",
      ownerId: rep1.id
    },
    {
      name: "True Fitness Club",
      website: "https://truefitnessclub.in",
      domain: "truefitnessclub.in",
      industry: "Health Club",
      size: "15-30",
      city: "Mumbai",
      state: "Maharashtra",
      address: "Malad West, Mumbai",
      ownerId: rep2.id
    },
    {
      name: "4US Fitness",
      website: "http://www.4usfitness.in",
      domain: "4usfitness.in",
      industry: "Fitness & Aerobics",
      size: "5-15",
      city: "Thane",
      state: "Maharashtra",
      address: "Naupada, Thane",
      ownerId: rep1.id
    },
    {
      name: "GYMNACITY The Body Technician",
      website: null,
      domain: null,
      industry: "Gymnasium",
      size: "5-10",
      city: "Mumbai",
      state: "Maharashtra",
      address: "Kandivali East, Mumbai",
      ownerId: rep2.id
    },
    {
      name: "ShadowBox Studio",
      website: null,
      domain: null,
      industry: "Boxing & Functional Studio",
      size: "5-10",
      city: "Mumbai",
      state: "Maharashtra",
      address: "Juhu, Mumbai",
      ownerId: rep1.id
    },
    {
      name: "Vala's Fitness Studio",
      website: "https://www.valasgym.in",
      domain: "valasgym.in",
      industry: "Elite Fitness Studio",
      size: "10-25",
      city: "Ahmedabad",
      state: "Gujarat",
      address: "Judges Bungalow Road, Ahmedabad",
      ownerId: rep2.id
    }
  ];

  const companies: Record<string, any> = {};
  for (const c of companiesData) {
    const created = await prisma.company.create({ data: c });
    companies[c.name] = created;

    // Attach Company Tags
    await prisma.companyTag.create({
      data: { companyId: created.id, tagId: tags['Gym / Fitness'].id }
    });
    if (c.city === 'Mumbai') {
      await prisma.companyTag.create({
        data: { companyId: created.id, tagId: tags['Mumbai'].id }
      });
    } else if (c.city === 'Ahmedabad') {
      await prisma.companyTag.create({
        data: { companyId: created.id, tagId: tags['Ahmedabad'].id }
      });
    }
  }
  console.log(`Created ${Object.keys(companies).length} companies.`);

  // 4. Create Core Contacts (from 7Blocks Core.xlsx + realistic additions = 50+ total)
  const contactsData = [
    {
      firstName: 'Kunal',
      lastName: 'Sharma',
      fullName: 'Kunal Sharma',
      email: 'kunal@gymnacity.com',
      phone: '+918799051473',
      companyId: companies['GYMNACITY The Body Technician']?.id,
      jobTitle: 'Founder & Head Coach',
      leadStatus: LeadStatus.CONTACTED,
      lifecycleStage: LifecycleStage.PROSPECT,
      leadSource: LeadSource.COLD_OUTREACH,
      serviceInterest: ServiceInterest.WEBSITE_NEW,
      leadScore: 45,
      ownerId: rep1.id,
      lastContactedAt: new Date(Date.now() - 2 * 86400000),
      nextFollowUpAt: new Date(Date.now() + 86400000),
    },
    {
      firstName: 'Mehak',
      lastName: 'Kapoor',
      fullName: 'Mehak Kapoor',
      email: 'mehak@celestetower.in',
      phone: '+919624742175',
      jobTitle: 'Club Manager',
      leadStatus: LeadStatus.MEETING_SCHEDULED,
      lifecycleStage: LifecycleStage.QUALIFIED,
      leadSource: LeadSource.COLD_OUTREACH,
      serviceInterest: ServiceInterest.WEBSITE_NEW,
      leadScore: 75,
      ownerId: rep2.id,
      lastContactedAt: new Date(Date.now() - 1 * 86400000),
      nextFollowUpAt: new Date(Date.now() + 2 * 86400000),
    },
    {
      firstName: 'Nitesh',
      lastName: 'Tiwari',
      fullName: 'Nitesh Tiwari',
      email: 'nitesh@geneticsfitness.com',
      phone: '+919173746752',
      jobTitle: 'Managing Partner',
      leadStatus: LeadStatus.MEETING_SCHEDULED,
      lifecycleStage: LifecycleStage.QUALIFIED,
      leadSource: LeadSource.COLD_OUTREACH,
      serviceInterest: ServiceInterest.WEBSITE_NEW,
      leadScore: 70,
      ownerId: rep1.id,
      lastContactedAt: new Date(Date.now() - 3 * 86400000),
      nextFollowUpAt: new Date(Date.now() + 86400000),
    },
    {
      firstName: 'Prithvi',
      lastName: 'Raj',
      fullName: 'Prithvi Raj',
      email: 'prithvi@shadowboxstudio.in',
      phone: '+919601255042',
      companyId: companies['ShadowBox Studio']?.id,
      jobTitle: 'Studio Director',
      leadStatus: LeadStatus.CALLBACK_SCHEDULED,
      lifecycleStage: LifecycleStage.LEAD,
      leadSource: LeadSource.COLD_OUTREACH,
      serviceInterest: ServiceInterest.WEBSITE_NEW,
      leadScore: 50,
      ownerId: rep2.id,
      lastContactedAt: new Date(Date.now() - 4 * 86400000),
      nextFollowUpAt: new Date(Date.now() + 25 * 86400000), // Next month approach
    },
    {
      firstName: 'Adarsh',
      lastName: 'Yadav',
      fullName: 'Adarsh Yadav',
      email: 'adianshgym@gmail.com',
      phone: '+917989409994',
      companyId: companies['Adiyash Gym']?.id,
      jobTitle: 'Owner',
      leadStatus: LeadStatus.DO_NOT_CONTACT,
      lifecycleStage: LifecycleStage.LOST,
      leadSource: LeadSource.COLD_OUTREACH,
      serviceInterest: ServiceInterest.WEBSITE_REDESIGN,
      leadScore: 10,
      ownerId: rep1.id,
      lastContactedAt: new Date(Date.now() - 5 * 86400000),
      nextFollowUpAt: null,
    },
    {
      firstName: 'Vikram',
      lastName: 'Chawla',
      fullName: 'Vikram Chawla',
      email: 'vikram@tronfitness.com',
      phone: '+918200692070',
      jobTitle: 'General Manager',
      leadStatus: LeadStatus.CALLBACK_SCHEDULED,
      lifecycleStage: LifecycleStage.PROSPECT,
      leadSource: LeadSource.COLD_OUTREACH,
      serviceInterest: ServiceInterest.WEBSITE_REDESIGN,
      leadScore: 65,
      ownerId: rep2.id,
      lastContactedAt: new Date(),
      nextFollowUpAt: new Date(new Date().setHours(17, 30, 0, 0)), // CALLING AT 5:30 (BOSS)
    },
    {
      firstName: 'Ashwin',
      lastName: 'Deshmukh',
      fullName: 'Ashwin Deshmukh',
      email: 'ashwin@appexgym.com',
      phone: '+918735009100',
      jobTitle: 'Proprietor',
      leadStatus: LeadStatus.UNRESPONSIVE,
      lifecycleStage: LifecycleStage.LEAD,
      leadSource: LeadSource.COLD_OUTREACH,
      serviceInterest: ServiceInterest.WEBSITE_REDESIGN,
      leadScore: 30,
      ownerId: rep1.id,
      lastContactedAt: new Date(Date.now() - 2 * 86400000),
      nextFollowUpAt: null,
    },
    {
      firstName: 'Ramesh',
      lastName: 'Patel',
      fullName: 'Ramesh Patel',
      email: 'contact@ramasgym.com',
      phone: '+919714174650',
      jobTitle: 'Owner',
      leadStatus: LeadStatus.CONTACTED,
      lifecycleStage: LifecycleStage.LEAD,
      leadSource: LeadSource.COLD_OUTREACH,
      serviceInterest: ServiceInterest.WEBSITE_REDESIGN,
      leadScore: 25,
      ownerId: rep2.id,
      lastContactedAt: new Date(Date.now() - 1 * 86400000),
      nextFollowUpAt: new Date(Date.now() + 86400000),
    },
    {
      firstName: 'Sanjay',
      lastName: 'Joshi',
      fullName: 'Sanjay Joshi',
      email: 'sanjay@uniquegym.in',
      phone: '+919727974099',
      jobTitle: 'Head Trainer',
      leadStatus: LeadStatus.CONTACTED,
      lifecycleStage: LifecycleStage.LEAD,
      leadSource: LeadSource.COLD_OUTREACH,
      serviceInterest: ServiceInterest.WEBSITE_NEW,
      leadScore: 40,
      ownerId: rep1.id,
      lastContactedAt: new Date(Date.now() - 2 * 86400000),
      nextFollowUpAt: new Date(Date.now() + 86400000),
    },
    {
      firstName: 'Harish',
      lastName: 'Mehta',
      fullName: 'Harish Mehta',
      email: 'harish@bullheadsgym.in',
      phone: '+917217602299',
      jobTitle: 'Managing Director',
      leadStatus: LeadStatus.CONTACTED,
      lifecycleStage: LifecycleStage.LEAD,
      leadSource: LeadSource.COLD_OUTREACH,
      serviceInterest: ServiceInterest.WEBSITE_NEW,
      leadScore: 25,
      ownerId: rep2.id,
      lastContactedAt: new Date(Date.now() - 3 * 86400000),
      nextFollowUpAt: new Date(Date.now() + 86400000),
    },
    {
      firstName: 'Gaurav',
      lastName: 'Bansal',
      fullName: 'Gaurav Bansal',
      email: 'gaurav@g8fitness.com',
      phone: '+917802962747',
      jobTitle: 'Founder',
      leadStatus: LeadStatus.CONTACTED,
      lifecycleStage: LifecycleStage.LEAD,
      leadSource: LeadSource.COLD_OUTREACH,
      serviceInterest: ServiceInterest.WEBSITE_REDESIGN,
      leadScore: 30,
      ownerId: rep1.id,
      lastContactedAt: new Date(Date.now() - 1 * 86400000),
      nextFollowUpAt: new Date(Date.now() + 86400000),
    },
    {
      firstName: 'Anna',
      lastName: 'D\'souza',
      fullName: 'Anna D\'souza',
      email: 'anna@annasgym.in',
      phone: '+919879004224',
      jobTitle: 'Owner & Yoga Master',
      leadStatus: LeadStatus.CALLBACK_SCHEDULED,
      lifecycleStage: LifecycleStage.PROSPECT,
      leadSource: LeadSource.COLD_OUTREACH,
      serviceInterest: ServiceInterest.WEBSITE_REDESIGN,
      leadScore: 55,
      ownerId: rep2.id,
      lastContactedAt: new Date(Date.now() - 1 * 86400000),
      nextFollowUpAt: new Date(Date.now() + 4 * 3600000),
    },
    {
      firstName: 'Chirag',
      lastName: 'Shah',
      fullName: 'Chirag Shah',
      email: 'chirag@creedculture.in',
      phone: '+919372161805',
      jobTitle: 'Founder',
      leadStatus: LeadStatus.LOST,
      lifecycleStage: LifecycleStage.LOST,
      leadSource: LeadSource.COLD_OUTREACH,
      serviceInterest: ServiceInterest.WEBSITE_REDESIGN,
      leadScore: 15,
      ownerId: rep1.id,
      lastContactedAt: new Date(Date.now() - 4 * 86400000),
      nextFollowUpAt: null,
    },
    {
      firstName: 'Sameer',
      lastName: 'Merchant',
      fullName: 'Sameer Merchant',
      email: 'sameer@globalfitness.com',
      phone: '+919867765599',
      companyId: companies['True Fitness Club']?.id,
      jobTitle: 'VP Operations',
      leadStatus: LeadStatus.MEETING_SCHEDULED,
      lifecycleStage: LifecycleStage.QUALIFIED,
      leadSource: LeadSource.COLD_OUTREACH,
      serviceInterest: ServiceInterest.WEBSITE_REDESIGN,
      leadScore: 80,
      ownerId: rep2.id,
      lastContactedAt: new Date(Date.now() - 2 * 86400000),
      nextFollowUpAt: new Date(Date.now() + 86400000),
    },
    {
      firstName: 'Rahul',
      lastName: 'Nair',
      fullName: 'Rahul Nair',
      email: '4usfitness72@gmail.com',
      phone: '+919892283328',
      companyId: companies['4US Fitness']?.id,
      jobTitle: 'Studio Owner',
      leadStatus: LeadStatus.DEMO_SCHEDULED,
      lifecycleStage: LifecycleStage.QUALIFIED,
      leadSource: LeadSource.COLD_OUTREACH,
      serviceInterest: ServiceInterest.SAAS,
      leadScore: 85,
      ownerId: rep1.id,
      lastContactedAt: new Date(),
      nextFollowUpAt: new Date(Date.now() + 86400000),
    },
    {
      firstName: 'Tiger',
      lastName: 'Shroff',
      fullName: 'Tiger Shroff (MMA Matrix)',
      email: 'info@mmamatrix.org',
      phone: '+918007400050',
      companyId: companies['MMA Matrix Gym']?.id,
      jobTitle: 'Promoter',
      leadStatus: LeadStatus.CONTACTED,
      lifecycleStage: LifecycleStage.LEAD,
      leadSource: LeadSource.COLD_OUTREACH,
      serviceInterest: ServiceInterest.WEBSITE_REDESIGN,
      leadScore: 50,
      ownerId: manager.id,
      lastContactedAt: new Date(Date.now() - 2 * 86400000),
      nextFollowUpAt: new Date(Date.now() + 86400000),
    },
    {
      firstName: 'Zeeshan',
      lastName: 'Siddique',
      fullName: 'Zeeshan Siddique',
      email: 'wecare@goldsgym.in',
      phone: '+919819999103',
      companyId: companies["Gold's Gym Powai"]?.id,
      jobTitle: 'Franchise Partner',
      leadStatus: LeadStatus.LOST,
      lifecycleStage: LifecycleStage.LOST,
      leadSource: LeadSource.COLD_OUTREACH,
      serviceInterest: ServiceInterest.CUSTOM_SOFTWARE,
      leadScore: 20,
      ownerId: rep1.id,
      lastContactedAt: new Date(Date.now() - 3 * 86400000),
      nextFollowUpAt: null,
    },
    {
      firstName: 'Bhavin',
      lastName: 'Vala',
      fullName: 'Bhavin Vala',
      email: 'valasgym@gmail.com',
      phone: '+916355267779',
      companyId: companies["Vala's Fitness Studio"]?.id,
      jobTitle: 'Founder',
      leadStatus: LeadStatus.PROPOSAL_SENT,
      lifecycleStage: LifecycleStage.QUALIFIED,
      leadSource: LeadSource.COLD_OUTREACH,
      serviceInterest: ServiceInterest.WEBSITE_REDESIGN,
      leadScore: 90,
      ownerId: rep2.id,
      lastContactedAt: new Date(Date.now() - 1 * 86400000),
      nextFollowUpAt: new Date(Date.now() + 86400000),
    }
  ];

  // Add 35 more realistic Indian leads to reach 50+ contacts
  const additionalNames = [
    ['Rajesh', 'Kulkarni', 'Talwalkars Pune', 'rajesh@talwalkars.com', '+919822012345', 'Pune', 'WEBSITE_NEW'],
    ['Amit', 'Saxena', 'Gold Coast Gym', 'amit@goldcoastgym.in', '+919811234567', 'Mumbai', 'WEBSITE_REDESIGN'],
    ['Deepak', 'Verma', 'FitZone Studio', 'deepak@fitzone.co.in', '+919833445566', 'Thane', 'WEB_APP'],
    ['Sunil', 'Gavaskar', 'Powerhouse Gym', 'sunil@powerhouse.in', '+919844556677', 'Mumbai', 'MOBILE_APP'],
    ['Pooja', 'Hegde', 'Curves Fitness', 'pooja@curves.in', '+919855667788', 'Mumbai', 'AUTOMATION'],
    ['Manoj', 'Bajpayee', 'Raw Iron Gym', 'manoj@rawiron.in', '+919866778899', 'Ahmedabad', 'WEBSITE_NEW'],
    ['Kavita', 'Krishnan', 'Oxygym', 'kavita@oxygym.in', '+919877889900', 'Pune', 'WEBSITE_REDESIGN'],
    ['Suresh', 'Raina', 'Spartan Gym', 'suresh@spartan.in', '+919888990011', 'Mumbai', 'SAAS'],
    ['Anil', 'Kapoor', 'Evergreen Wellness', 'anil@evergreen.in', '+919899001122', 'Mumbai', 'CUSTOM_SOFTWARE'],
    ['Sunita', 'Williams', 'Cosmo Fitness', 'sunita@cosmo.in', '+919900112233', 'Ahmedabad', 'WEBSITE_NEW'],
    ['Vivek', 'Oberoi', 'Beast Mode Gym', 'vivek@beastmode.in', '+919911223344', 'Thane', 'WEBSITE_REDESIGN'],
    ['Rohit', 'Roy', 'Barbell Club', 'rohit@barbell.in', '+919922334455', 'Mumbai', 'WEB_APP'],
    ['Neha', 'Dhupia', 'Fit Moms Studio', 'neha@fitmoms.in', '+919933445566', 'Mumbai', 'MOBILE_APP'],
    ['Girish', 'Karnad', 'Classic Gym', 'girish@classicgym.in', '+919944556677', 'Pune', 'WEBSITE_NEW'],
    ['Alok', 'Nath', 'Sanskar Fitness', 'alok@sanskar.in', '+919955667788', 'Ahmedabad', 'WEBSITE_REDESIGN'],
    ['Divya', 'Dutta', 'Soul & Sweat', 'divya@soulsweat.in', '+919966778899', 'Mumbai', 'AUTOMATION'],
    ['Manish', 'Malhotra', 'Glam Fitness', 'manish@glamfit.in', '+919977889900', 'Mumbai', 'WEBSITE_NEW'],
    ['Shabana', 'Azmi', 'Holistic Health', 'shabana@holistic.in', '+919988990011', 'Pune', 'WEBSITE_REDESIGN'],
    ['Nawaz', 'Siddiqui', 'Hardcore Gym', 'nawaz@hardcore.in', '+919999001122', 'Thane', 'SAAS'],
    ['Pankaj', 'Tripathi', 'Desi Akhada 2.0', 'pankaj@desiakhada.in', '+919700112233', 'Ahmedabad', 'CUSTOM_SOFTWARE'],
    ['Kajol', 'Devgn', 'Active Life', 'kajol@activelife.in', '+919711223344', 'Mumbai', 'WEBSITE_NEW'],
    ['Ajay', 'Devgn', 'Singham Fitness', 'ajay@singhamfit.in', '+919722334455', 'Mumbai', 'WEBSITE_REDESIGN'],
    ['Ranveer', 'Singh', 'Energy High Gym', 'ranveer@energyhigh.in', '+919733445566', 'Mumbai', 'WEB_APP'],
    ['Deepika', 'Padukone', 'Zen Yoga & Barre', 'deepika@zenyoga.in', '+919744556677', 'Mumbai', 'MOBILE_APP'],
    ['Katrina', 'Kaif', 'Kay Fitness Studio', 'katrina@kayfit.in', '+919755667788', 'Mumbai', 'AUTOMATION'],
    ['Vicky', 'Kaushal', 'Josh Gym', 'vicky@joshgym.in', '+919766778899', 'Pune', 'WEBSITE_NEW'],
    ['Varun', 'Dhawan', 'Bhediya Crossfit', 'varun@bhediyafit.in', '+919777889900', 'Mumbai', 'WEBSITE_REDESIGN'],
    ['Alia', 'Bhatt', 'Sunshine Pilates', 'alia@sunshinepilates.in', '+919788990011', 'Mumbai', 'SAAS'],
    ['Ranbir', 'Kapoor', 'Animal Gym', 'ranbir@animalgym.in', '+919799001122', 'Mumbai', 'CUSTOM_SOFTWARE'],
    ['Shraddha', 'Kapoor', 'Breathe Fitness', 'shraddha@breathe.in', '+919600112233', 'Thane', 'WEBSITE_NEW'],
    ['Kartik', 'Aaryan', 'Dhamaka Gym', 'kartik@dhamakagym.in', '+919611223344', 'Ahmedabad', 'WEBSITE_REDESIGN'],
    ['Kriti', 'Sanon', 'The Tribe Fitness', 'kriti@thetribefit.in', '+919622334455', 'Mumbai', 'WEB_APP'],
    ['Kiara', 'Advani', 'Glow Fitness Club', 'kiara@glowfit.in', '+919633445566', 'Mumbai', 'MOBILE_APP'],
    ['Sidharth', 'Malhotra', 'Warrior Gym', 'sidharth@warriorgym.in', '+919644556677', 'Pune', 'AUTOMATION'],
    ['Ayushmann', 'Khurrana', 'Dream Girl Studio', 'ayushmann@dreamstudio.in', '+919655667788', 'Ahmedabad', 'WEBSITE_NEW']
  ];

  const assignedUsers = [rep1.id, rep2.id, manager.id];
  const statuses = [
    LeadStatus.NEW, LeadStatus.CONTACTED, LeadStatus.INTERESTED,
    LeadStatus.CALLBACK_SCHEDULED, LeadStatus.DEMO_SCHEDULED,
    LeadStatus.MEETING_SCHEDULED, LeadStatus.PROPOSAL_SENT,
    LeadStatus.NEGOTIATION, LeadStatus.WON, LeadStatus.LOST
  ];

  for (let i = 0; i < additionalNames.length; i++) {
    const item = additionalNames[i];
    const status = statuses[i % statuses.length];
    contactsData.push({
      firstName: item[0],
      lastName: item[1],
      fullName: `${item[0]} ${item[1]}`,
      email: item[3],
      phone: item[4],
      companyId: undefined,
      jobTitle: 'Managing Director',
      leadStatus: status,
      lifecycleStage: status === LeadStatus.WON ? LifecycleStage.CUSTOMER : (status === LeadStatus.LOST ? LifecycleStage.LOST : LifecycleStage.PROSPECT),
      leadSource: i % 3 === 0 ? LeadSource.EXCEL_IMPORT : (i % 2 === 0 ? LeadSource.COLD_OUTREACH : LeadSource.REFERRAL),
      serviceInterest: item[6] as ServiceInterest,
      leadScore: 20 + ((i * 7) % 80),
      ownerId: assignedUsers[i % assignedUsers.length],
      lastContactedAt: new Date(Date.now() - (i % 10) * 86400000),
      nextFollowUpAt: status !== LeadStatus.LOST && status !== LeadStatus.WON ? new Date(Date.now() + ((i % 5) + 1) * 86400000) : null,
    });
  }

  const createdContacts: any[] = [];
  for (const c of contactsData) {
    const contact = await prisma.contact.create({ data: c });
    createdContacts.push(contact);

    // Add tags
    if (contact.leadStatus === LeadStatus.INTERESTED || contact.leadStatus === LeadStatus.PROPOSAL_SENT) {
      await prisma.contactTag.create({ data: { contactId: contact.id, tagId: tags['Hot Lead'].id } });
    }
    if (contact.serviceInterest === ServiceInterest.WEBSITE_NEW) {
      await prisma.contactTag.create({ data: { contactId: contact.id, tagId: tags['Website Needed'].id } });
    } else if (contact.serviceInterest === ServiceInterest.WEBSITE_REDESIGN) {
      await prisma.contactTag.create({ data: { contactId: contact.id, tagId: tags['Website Update'].id } });
    }
    if (contact.leadScore >= 70) {
      await prisma.contactTag.create({ data: { contactId: contact.id, tagId: tags['High Value'].id } });
    }
  }

  console.log(`Created ${createdContacts.length} Contacts with Tags and Scores.`);

  // 5. Create Deals (20+ deals across stages with INR amounts)
  const dealsData = [
    {
      name: "Vala's Fitness Studio Website Redesign & Booking Portal",
      value: 125000,
      stage: DealStage.PROPOSAL,
      probability: 60,
      expectedCloseDate: new Date(Date.now() + 14 * 86400000),
      serviceType: ServiceInterest.WEBSITE_REDESIGN,
      contactId: createdContacts.find(c => c.fullName === 'Bhavin Vala')?.id,
      companyId: companies["Vala's Fitness Studio"]?.id,
      ownerId: rep2.id,
      description: "Full redesign of existing website + member class booking system."
    },
    {
      name: "4US Fitness Member Mobile App & CRM Integration",
      value: 280000,
      stage: DealStage.QUALIFICATION,
      probability: 30,
      expectedCloseDate: new Date(Date.now() + 30 * 86400000),
      serviceType: ServiceInterest.MOBILE_APP,
      contactId: createdContacts.find(c => c.fullName === 'Rahul Nair')?.id,
      companyId: companies['4US Fitness']?.id,
      ownerId: rep1.id,
      description: "Custom cross-platform Flutter/React Native application for member workouts and gym access QR."
    },
    {
      name: "True Fitness Club High-Performance Website & SEO",
      value: 95000,
      stage: DealStage.NEGOTIATION,
      probability: 80,
      expectedCloseDate: new Date(Date.now() + 7 * 86400000),
      serviceType: ServiceInterest.WEBSITE_REDESIGN,
      contactId: createdContacts.find(c => c.fullName === 'Sameer Merchant')?.id,
      companyId: companies['True Fitness Club']?.id,
      ownerId: rep2.id,
      description: "Revamp slow WordPress site to Next.js with local SEO optimization in Malad."
    },
    {
      name: "Mehak Kapoor - Celeste Tower Gym Digital Presence",
      value: 65000,
      stage: DealStage.PROSPECTING,
      probability: 10,
      expectedCloseDate: new Date(Date.now() + 45 * 86400000),
      serviceType: ServiceInterest.WEBSITE_NEW,
      contactId: createdContacts.find(c => c.fullName === 'Mehak Kapoor')?.id,
      ownerId: rep2.id,
      description: "Brand new modern landing page with lead capture and WhatsApp integration."
    },
    {
      name: "Genetics Fitness Club Brand Portal",
      value: 85000,
      stage: DealStage.QUALIFICATION,
      probability: 30,
      expectedCloseDate: new Date(Date.now() + 20 * 86400000),
      serviceType: ServiceInterest.WEBSITE_NEW,
      contactId: createdContacts.find(c => c.fullName === 'Nitesh Tiwari')?.id,
      ownerId: rep1.id,
      description: "First official website for Genetics Fitness Club."
    },
    {
      name: "Tron Fitness Factory Gym Automation System",
      value: 150000,
      stage: DealStage.PROSPECTING,
      probability: 10,
      expectedCloseDate: new Date(Date.now() + 30 * 86400000),
      serviceType: ServiceInterest.AUTOMATION,
      contactId: createdContacts.find(c => c.fullName === 'Vikram Chawla')?.id,
      ownerId: rep2.id,
      description: "WhatsApp auto-followups and renewal reminder automation."
    },
    {
      name: "MMA Matrix Bandra Multi-Branch Franchise Platform",
      value: 450000,
      stage: DealStage.PROPOSAL,
      probability: 60,
      expectedCloseDate: new Date(Date.now() + 40 * 86400000),
      serviceType: ServiceInterest.CUSTOM_SOFTWARE,
      contactId: createdContacts.find(c => c.fullName.includes('MMA Matrix'))?.id,
      companyId: companies['MMA Matrix Gym']?.id,
      ownerId: manager.id,
      description: "Enterprise multi-tenant portal for member check-in, trainer management, and billing."
    },
    {
      name: "Gold's Gym Powai Lead Generation Funnel",
      value: 110000,
      stage: DealStage.CLOSED_LOST,
      probability: 0,
      expectedCloseDate: new Date(Date.now() - 10 * 86400000),
      serviceType: ServiceInterest.WEBSITE_REDESIGN,
      contactId: createdContacts.find(c => c.fullName === 'Zeeshan Siddique')?.id,
      companyId: companies["Gold's Gym Powai"]?.id,
      ownerId: rep1.id,
      description: "Lost because regional marketing is centrally managed by Mumbai headquarters.",
      lostReason: "Already has centralized corporate software and website."
    },
    {
      name: "Fun And Fit Thane Website & Diet Tracker",
      value: 140000,
      stage: DealStage.CLOSED_WON,
      probability: 100,
      expectedCloseDate: new Date(Date.now() - 5 * 86400000),
      serviceType: ServiceInterest.SAAS,
      contactId: createdContacts.find(c => c.fullName.includes('Anna'))?.id,
      companyId: companies['Fun And Fit Gym']?.id,
      ownerId: rep2.id,
      description: "Closed Won! Initial 50% advance received, development initiated."
    },
    {
      name: "48 Fitness Luxury Member Portal",
      value: 320000,
      stage: DealStage.CLOSED_WON,
      probability: 100,
      expectedCloseDate: new Date(Date.now() - 15 * 86400000),
      serviceType: ServiceInterest.WEB_APP,
      contactId: createdContacts.find(c => c.fullName.includes('Gaurav'))?.id,
      companyId: companies['48 Fitness']?.id,
      ownerId: rep1.id,
      description: "Closed Won! VIP member portal with personalized trainer booking."
    }
  ];

  // Add 12 more deals to reach 22 deals
  const additionalDeals = [
    { name: "Singham Fitness High Voltage Website", val: 90000, stage: DealStage.PROPOSAL, prob: 60, rep: rep1.id },
    { name: "Spartan Gym Member Mobile App", val: 210000, stage: DealStage.QUALIFICATION, prob: 30, rep: rep2.id },
    { name: "Zen Yoga & Barre Studio Website", val: 75000, stage: DealStage.NEGOTIATION, prob: 80, rep: rep2.id },
    { name: "Gold Coast Gym WhatsApp Automation", val: 55000, stage: DealStage.PROSPECTING, prob: 10, rep: rep1.id },
    { name: "The Tribe Fitness SaaS Dashboard", val: 180000, stage: DealStage.CLOSED_WON, prob: 100, rep: manager.id },
    { name: "Warrior Gym Redesign", val: 80000, stage: DealStage.PROPOSAL, prob: 60, rep: rep1.id },
    { name: "Desi Akhada 2.0 Website", val: 60000, stage: DealStage.PROSPECTING, prob: 10, rep: rep2.id },
    { name: "Beast Mode Gym Mobile App", val: 250000, stage: DealStage.QUALIFICATION, prob: 30, rep: rep1.id },
    { name: "Soul & Sweat Custom Software", val: 350000, stage: DealStage.NEGOTIATION, prob: 80, rep: manager.id },
    { name: "Cosmo Fitness Ahmedabad Website", val: 70000, stage: DealStage.PROPOSAL, prob: 60, rep: rep2.id },
    { name: "Glam Fitness Website & Booking", val: 115000, stage: DealStage.PROSPECTING, prob: 10, rep: rep1.id },
    { name: "Dhamaka Gym Ahmedabad Portal", val: 95000, stage: DealStage.CLOSED_LOST, prob: 0, rep: rep2.id, lost: "Budget constraints" }
  ];

  for (let i = 0; i < additionalDeals.length; i++) {
    const d = additionalDeals[i];
    dealsData.push({
      name: d.name,
      value: d.val,
      stage: d.stage,
      probability: d.prob,
      expectedCloseDate: new Date(Date.now() + (i * 3 + 5) * 86400000),
      serviceType: ServiceInterest.WEBSITE_NEW,
      contactId: createdContacts[18 + i]?.id,
      companyId: undefined,
      ownerId: d.rep,
      description: `Opportunity created for ${d.name}.`,
      lostReason: d.lost || undefined
    });
  }

  const createdDeals: any[] = [];
  for (const d of dealsData) {
    const deal = await prisma.deal.create({ data: d });
    createdDeals.push(deal);
  }
  console.log(`Created ${createdDeals.length} Deals.`);

  // 6. Create Activities (100+ append-only events: Calls, Emails, WhatsApp, Meetings, Status Changes)
  const activitiesData: any[] = [];

  // Kunal Sharma (Row 2 from Excel: Cold call outcome No Need Website)
  const kunal = createdContacts.find(c => c.fullName === 'Kunal Sharma');
  if (kunal) {
    activitiesData.push(
      {
        type: ActivityType.COLD_CALL,
        title: 'Cold call outreach to Kunal',
        description: 'Called to discuss GYMNACITY website development.',
        duration: 180,
        outcome: ActivityOutcome.NOT_INTERESTED,
        notes: 'Kunal stated they currently rely on Instagram and do not see immediate need for a website.',
        contactId: kunal.id,
        userId: rep1.id,
        createdAt: new Date(Date.now() - 2 * 86400000)
      },
      {
        type: ActivityType.STATUS_CHANGE,
        title: 'Lead Status Changed',
        description: 'Status updated from NEW to CONTACTED after initial call.',
        outcome: ActivityOutcome.OTHER,
        contactId: kunal.id,
        userId: rep1.id,
        createdAt: new Date(Date.now() - 2 * 86400000)
      }
    );
  }

  // Mehak Kapoor (Row 3 from Excel: Meeting Left)
  const mehak = createdContacts.find(c => c.fullName === 'Mehak Kapoor');
  if (mehak) {
    activitiesData.push(
      {
        type: ActivityType.COLD_CALL,
        title: 'Initial Discovery Call with Mehak',
        description: 'Spoke with Mehak regarding Celeste Tower gym web portal.',
        duration: 320,
        outcome: ActivityOutcome.MEETING_REQUESTED,
        notes: 'Mehak was very receptive. Requested an online demo meeting next Tuesday.',
        contactId: mehak.id,
        userId: rep2.id,
        createdAt: new Date(Date.now() - 1 * 86400000)
      },
      {
        type: ActivityType.MEETING_SCHEDULED,
        title: 'Meeting Scheduled: CRM & Website Demo',
        description: 'Scheduled Zoom demo with Mehak and club committee.',
        outcome: ActivityOutcome.POSITIVE,
        notes: 'Meeting link shared via WhatsApp and email.',
        contactId: mehak.id,
        userId: rep2.id,
        createdAt: new Date(Date.now() - 1 * 86400000)
      }
    );
  }

  // Vikram Chawla (Row 7 from Excel: CALLING AT 5:30 (BOSS))
  const vikram = createdContacts.find(c => c.fullName === 'Vikram Chawla');
  if (vikram) {
    activitiesData.push(
      {
        type: ActivityType.COLD_CALL,
        title: 'Call to Tron Fitness Factory',
        description: 'Connected with front desk and assistant manager.',
        duration: 95,
        outcome: ActivityOutcome.CALLBACK_REQUESTED,
        notes: 'Boss requested callback precisely at 5:30 PM today to discuss gym automation.',
        contactId: vikram.id,
        userId: rep2.id,
        createdAt: new Date(Date.now() - 3 * 3600000)
      },
      {
        type: ActivityType.NOTE,
        title: 'Priority Callback Note',
        description: 'Boss requested callback at 5:30 PM. Focus pitch on WhatsApp auto-renewal alerts.',
        contactId: vikram.id,
        userId: rep2.id,
        createdAt: new Date(Date.now() - 3 * 3600000)
      }
    );
  }

  // Rahul Nair (Row 17 from Excel: SEND DEMO)
  const rahul = createdContacts.find(c => c.fullName === 'Rahul Nair');
  if (rahul) {
    activitiesData.push(
      {
        type: ActivityType.COLD_CALL,
        title: 'Outreach Call with Rahul Nair',
        description: 'Discussed member engagement and mobile apps.',
        duration: 410,
        outcome: ActivityOutcome.DEMO_REQUESTED,
        notes: 'Rahul requested a recorded demo of the gym member app with QR check-in.',
        contactId: rahul.id,
        userId: rep1.id,
        createdAt: new Date(Date.now() - 86400000)
      },
      {
        type: ActivityType.DEMO_SENT,
        title: 'App Demo Video & Deck Sent',
        description: 'Sent Loom demo link and PDF presentation to 4usfitness72@gmail.com.',
        outcome: ActivityOutcome.POSITIVE,
        contactId: rahul.id,
        userId: rep1.id,
        createdAt: new Date(Date.now() - 12 * 3600000)
      },
      {
        type: ActivityType.WHATSAPP,
        title: 'WhatsApp Message Sent',
        description: 'Sent demo video link directly on WhatsApp to confirm delivery.',
        outcome: ActivityOutcome.POSITIVE,
        contactId: rahul.id,
        userId: rep1.id,
        createdAt: new Date(Date.now() - 11 * 3600000)
      }
    );
  }

  // Bhavin Vala (Vala's Fitness Studio - Proposal Sent)
  const bhavin = createdContacts.find(c => c.fullName === 'Bhavin Vala');
  if (bhavin) {
    activitiesData.push(
      {
        type: ActivityType.EMAIL_SENT,
        title: 'Comprehensive Website Redesign Proposal',
        description: 'Sent PDF proposal for ₹1,25,000 to valasgym@gmail.com.',
        outcome: ActivityOutcome.POSITIVE,
        contactId: bhavin.id,
        userId: rep2.id,
        createdAt: new Date(Date.now() - 24 * 3600000)
      },
      {
        type: ActivityType.EMAIL_OPENED,
        title: 'Email Opened by Bhavin',
        description: 'Recipient opened proposal email from Chrome on macOS.',
        outcome: ActivityOutcome.POSITIVE,
        contactId: bhavin.id,
        userId: rep2.id,
        createdAt: new Date(Date.now() - 20 * 3600000)
      },
      {
        type: ActivityType.EMAIL_REPLIED,
        title: 'Email Reply Received',
        description: 'Bhavin replied: "The designs look great. Can we do a call Thursday to finalize milestones?"',
        outcome: ActivityOutcome.POSITIVE,
        contactId: bhavin.id,
        userId: rep2.id,
        createdAt: new Date(Date.now() - 16 * 3600000)
      }
    );
  }

  // Generate activities for all other contacts to exceed 100 activities
  for (let i = 0; i < createdContacts.length; i++) {
    const c = createdContacts[i];
    const uId = c.ownerId || rep1.id;
    activitiesData.push({
      type: ActivityType.EMAIL_SENT,
      title: `7BLOCKS Cold Outreach Campaign #1`,
      description: `Sent personalized introductory email proposing digital growth and website audit.`,
      outcome: i % 3 === 0 ? ActivityOutcome.INTERESTED : ActivityOutcome.NO_ANSWER,
      contactId: c.id,
      userId: uId,
      createdAt: new Date(Date.now() - (i + 1) * 86400000)
    });

    if (i % 2 === 0) {
      activitiesData.push({
        type: ActivityType.COLD_CALL,
        title: `Follow-up Call to ${c.fullName}`,
        description: `Followed up on email sent earlier this week.`,
        duration: 120 + (i * 15),
        outcome: i % 4 === 0 ? ActivityOutcome.CALLBACK_REQUESTED : (i % 3 === 0 ? ActivityOutcome.INTERESTED : ActivityOutcome.BUSY),
        notes: `Call notes logged for ${c.fullName}. Lead expressed ${i % 3 === 0 ? 'interest in seeing portfolio' : 'will check email later'}.`,
        contactId: c.id,
        userId: uId,
        createdAt: new Date(Date.now() - i * 43200000)
      });
    }
  }

  for (const a of activitiesData) {
    await prisma.activity.create({ data: a });
  }
  console.log(`Created ${activitiesData.length} Activities.`);

  // 7. Create Tasks (30+ tasks spanning Overdue, Today, Tomorrow, and Next Week)
  const tasksData = [
    {
      title: "Call back boss of Tron Fitness Factory",
      description: "Boss requested callback precisely at 5:30 PM regarding WhatsApp automations.",
      dueDate: new Date(new Date().setHours(17, 30, 0, 0)),
      priority: TaskPriority.URGENT,
      status: TaskStatus.TODO,
      assignedToId: rep2.id,
      contactId: createdContacts.find(c => c.fullName === 'Vikram Chawla')?.id,
      reminderAt: new Date(new Date().setHours(17, 15, 0, 0))
    },
    {
      title: "Follow up with Bhavin Vala on Proposal",
      description: "Bhavin opened the proposal and replied positively. Schedule final contract call.",
      dueDate: new Date(Date.now() + 86400000),
      priority: TaskPriority.HIGH,
      status: TaskStatus.TODO,
      assignedToId: rep2.id,
      contactId: createdContacts.find(c => c.fullName === 'Bhavin Vala')?.id
    },
    {
      title: "Send demo video to Rahul Nair (4US Fitness)",
      description: "Ensure the custom workout tracking module is highlighted in the demo video.",
      dueDate: new Date(),
      priority: TaskPriority.HIGH,
      status: TaskStatus.COMPLETED,
      completedAt: new Date(),
      assignedToId: rep1.id,
      contactId: createdContacts.find(c => c.fullName === 'Rahul Nair')?.id
    },
    {
      title: "Prepare Zoom presentation for Mehak Kapoor",
      description: "Customize 7BLOCKS portfolio slide with Celeste Tower luxury branding.",
      dueDate: new Date(Date.now() + 2 * 86400000),
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.TODO,
      assignedToId: rep2.id,
      contactId: createdContacts.find(c => c.fullName === 'Mehak Kapoor')?.id
    },
    {
      title: "Next month follow-up: Prithvi Raj (ShadowBox Studio)",
      description: "Prithvi asked to approach next month when their new boxing ring expansion is finished.",
      dueDate: new Date(Date.now() + 25 * 86400000),
      priority: TaskPriority.LOW,
      status: TaskStatus.TODO,
      assignedToId: rep2.id,
      contactId: createdContacts.find(c => c.fullName === 'Prithvi Raj')?.id
    },
    {
      title: "OVERDUE: Review proposal draft with Rohan",
      description: "Go over pricing tiers for MMA Matrix enterprise multi-branch deal.",
      dueDate: new Date(Date.now() - 2 * 86400000),
      priority: TaskPriority.URGENT,
      status: TaskStatus.TODO,
      assignedToId: rep1.id
    },
    {
      title: "OVERDUE: Call Anna D'souza (Anna's Gym)",
      description: "Anna asked to call back after afternoon yoga session.",
      dueDate: new Date(Date.now() - 86400000),
      priority: TaskPriority.HIGH,
      status: TaskStatus.TODO,
      assignedToId: rep2.id,
      contactId: createdContacts.find(c => c.fullName.includes('Anna'))?.id
    }
  ];

  // Add 25 more tasks to exceed 30 tasks
  for (let i = 0; i < 25; i++) {
    const isOverdue = i < 4;
    const isToday = i >= 4 && i < 10;
    const isUpcoming = i >= 10;

    let due = new Date();
    if (isOverdue) {
      due = new Date(Date.now() - (i + 1) * 86400000);
    } else if (isToday) {
      due = new Date(new Date().setHours(14 + (i % 6), 0, 0, 0));
    } else {
      due = new Date(Date.now() + ((i % 7) + 1) * 86400000);
    }

    tasksData.push({
      title: `Outreach Follow-up Task #${i + 1}: ${createdContacts[i % createdContacts.length].fullName}`,
      description: `Follow up via phone/email regarding website requirement status.`,
      dueDate: due,
      priority: i % 4 === 0 ? TaskPriority.HIGH : (i % 3 === 0 ? TaskPriority.URGENT : TaskPriority.MEDIUM),
      status: i % 5 === 0 ? TaskStatus.COMPLETED : TaskStatus.TODO,
      completedAt: i % 5 === 0 ? new Date() : undefined,
      assignedToId: assignedUsers[i % assignedUsers.length],
      contactId: createdContacts[i % createdContacts.length].id,
      reminderAt: isToday ? new Date(due.getTime() - 15 * 60000) : undefined
    });
  }

  for (const t of tasksData) {
    await prisma.task.create({ data: t });
  }
  console.log(`Created ${tasksData.length} Tasks.`);

  // 8. Create Meetings
  const meetingsData = [
    {
      title: "Demo & Solution Walkthrough: Mehak Kapoor",
      contactId: createdContacts.find(c => c.fullName === 'Mehak Kapoor')?.id,
      userId: rep2.id,
      startTime: new Date(Date.now() + 2 * 86400000),
      endTime: new Date(Date.now() + 2 * 86400000 + 45 * 60000),
      location: "Google Meet",
      meetingLink: "https://meet.google.com/xyz-7blk-crm",
      notes: "Focus on member login and automated lead forms.",
      status: MeetingStatus.SCHEDULED
    },
    {
      title: "Final Scope & Contract Review: Bhavin Vala",
      contactId: createdContacts.find(c => c.fullName === 'Bhavin Vala')?.id,
      companyId: companies["Vala's Fitness Studio"]?.id,
      userId: rep2.id,
      startTime: new Date(Date.now() + 3 * 86400000),
      endTime: new Date(Date.now() + 3 * 86400000 + 30 * 60000),
      location: "Vala's Fitness Studio, Judges Bungalow Road, Ahmedabad",
      notes: "In-person contract signing with Bhavin.",
      status: MeetingStatus.SCHEDULED
    },
    {
      title: "Kickoff Call: 48 Fitness Member Portal",
      contactId: createdContacts.find(c => c.fullName.includes('Gaurav'))?.id,
      companyId: companies['48 Fitness']?.id,
      userId: rep1.id,
      startTime: new Date(Date.now() - 5 * 86400000),
      endTime: new Date(Date.now() - 5 * 86400000 + 60 * 60000),
      location: "Zoom",
      meetingLink: "https://zoom.us/j/7blocks48fit",
      notes: "Sprint 1 requirements agreed.",
      status: MeetingStatus.COMPLETED
    }
  ];

  for (const m of meetingsData) {
    await prisma.meeting.create({ data: m });
  }
  console.log(`Created ${meetingsData.length} Meetings.`);

  // 9. Create Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: rep2.id,
        type: 'TASK_DUE',
        title: 'Priority Call at 5:30 PM',
        message: 'Tron Fitness Factory boss requested callback at 5:30 PM today.',
        isRead: false
      },
      {
        userId: rep2.id,
        type: 'EMAIL_REPLY',
        title: 'Bhavin Vala replied to Proposal',
        message: 'Bhavin Vala opened your proposal and replied requesting a contract call.',
        isRead: false
      },
      {
        userId: rep1.id,
        type: 'DEAL_OVERDUE',
        title: 'Deal Follow-up Overdue',
        message: 'Gold Coast Gym deal expected close date was yesterday.',
        isRead: true
      },
      {
        userId: admin.id,
        type: 'IMPORT_COMPLETED',
        title: 'Excel Migration Completed',
        message: 'Successfully imported 7Blocks Core records into CRM entities.',
        isRead: false
      }
    ]
  });

  // 10. Create Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: admin.id,
        action: AuditAction.USER_CREATED,
        entityType: 'User',
        entityId: rep1.id,
        newValues: { name: 'Aarav Patel', role: 'SALES_REP' },
        ipAddress: '127.0.0.1'
      },
      {
        userId: rep2.id,
        action: AuditAction.DEAL_STAGE_CHANGED,
        entityType: 'Deal',
        entityId: createdDeals[0]?.id || 'deal-1',
        oldValues: { stage: 'QUALIFICATION', probability: 30 },
        newValues: { stage: 'PROPOSAL', probability: 60 },
        ipAddress: '127.0.0.1'
      },
      {
        userId: rep1.id,
        action: AuditAction.CONTACT_UPDATED,
        entityType: 'Contact',
        entityId: kunal?.id || 'contact-1',
        oldValues: { leadStatus: 'NEW' },
        newValues: { leadStatus: 'CONTACTED' },
        ipAddress: '127.0.0.1'
      }
    ]
  });

  console.log('--- Seed Data Successfully Inserted! ---');
  console.log('Admin: admin@7blocks.com / 7Blocks@2026!');
  console.log('Manager: manager@7blocks.com / 7Blocks@2026!');
  console.log('Sales Rep: aarav@7blocks.com / 7Blocks@2026!');
  console.log('Sales Rep: priya@7blocks.com / 7Blocks@2026!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
