import { ProjectData } from "@/types/project";

export const projectsData: ProjectData[] = [
  {
    id: "1",
    name: "Material XD Version",
    company: "Material XD Version",
    icon: "palette",
    iconColor: "bg-gray-900 text-white",
    members: [
      { id: "1", name: "Alex Johnson", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face", color: "bg-blue-500" },
      { id: "2", name: "Sarah Chen", avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face", color: "bg-green-500" },
      { id: "3", name: "Michael Brown", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face", color: "bg-yellow-500" },
      { id: "4", name: "Emma Davis", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face", color: "bg-red-500" }
    ],
    budget: "$14,000",
    completion: 60,
    status: "working"
  },
  {
    id: "2",
    name: "Add Progress Track",
    company: "Add Progress Track",
    icon: "chart-line",
    iconColor: "bg-blue-500 text-white",
    members: [
      { id: "5", name: "David Wilson", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face", color: "bg-purple-500" },
      { id: "6", name: "Jessica Martinez", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face", color: "bg-pink-500" }
    ],
    budget: "$3,000",
    completion: 10,
    status: "working"
  },
  {
    id: "3",
    name: "Fix Platform Errors",
    company: "Fix Platform Errors",
    icon: "bug",
    iconColor: "bg-red-500 text-white",
    members: [
      { id: "7", name: "Ryan Thompson", avatar: "https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?w=150&h=150&fit=crop&crop=face", color: "bg-indigo-500" },
      { id: "8", name: "Lisa Garcia", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face", color: "bg-teal-500" }
    ],
    budget: "Not set",
    completion: 100,
    status: "done"
  },
  {
    id: "4",
    name: "Launch our Mobile App",
    company: "Launch our Mobile App",
    icon: "smartphone",
    iconColor: "bg-green-500 text-white",
    members: [
      { id: "9", name: "James Rodriguez", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face", color: "bg-orange-500" },
      { id: "10", name: "Maria Lopez", avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face", color: "bg-cyan-500" },
      { id: "11", name: "Kevin Lee", avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&h=150&fit=crop&crop=face", color: "bg-lime-500" },
      { id: "12", name: "Anna White", avatar: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=150&h=150&fit=crop&crop=face", color: "bg-rose-500" }
    ],
    budget: "$20,500",
    completion: 100,
    status: "done"
  },
  {
    id: "5",
    name: "Add the New Pricing Page",
    company: "Add the New Pricing Page",
    icon: "tag",
    iconColor: "bg-blue-600 text-white",
    members: [
      { id: "13", name: "User 13", avatar: "", color: "bg-gray-800" }
    ],
    budget: "$500",
    completion: 25,
    status: "working"
  },
  {
    id: "6",
    name: "Redesign New Online Shop",
    company: "Redesign New Online Shop",
    icon: "shopping-bag",
    iconColor: "bg-pink-500 text-white",
    members: [
      { id: "14", name: "User 14", avatar: "", color: "bg-violet-500" },
      { id: "15", name: "User 15", avatar: "", color: "bg-amber-500" }
    ],
    budget: "$2,000",
    completion: 40,
    status: "working"
  }
];