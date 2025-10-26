import { useState } from "react";
import { User, Wrench, Building2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import Dashboard from "./Dashboard";
import DashboardFuncionario from "./DashboardFuncionario";
import DashboardFornecedor from "./DashboardFornecedor";

type UserType = "sindico" | "funcionario" | "fornecedor";

export default function DashboardSelector() {
  const [selectedUser, setSelectedUser] = useState<UserType>("sindico");

  const userTypes = [
    {
      type: "sindico" as UserType,
      title: "Síndico",
      description: "Gestão completa do condomínio",
      icon: Building2,
      color: "bg-blue-500"
    },
    {
      type: "funcionario" as UserType,
      title: "Funcionário",
      description: "Execução de manutenções",
      icon: Wrench,
      color: "bg-green-500"
    },
    {
      type: "fornecedor" as UserType,
      title: "Fornecedor",
      description: "Prestação de serviços",
      icon: User,
      color: "bg-purple-500"
    }
  ];

  const renderDashboard = () => {
    switch (selectedUser) {
      case "sindico":
        return <Dashboard />;
      case "funcionario":
        return <DashboardFuncionario />;
      case "fornecedor":
        return <DashboardFornecedor />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* User Type Selector */}
      <div className="bg-white border-b p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-xl font-bold text-gray-900 mb-4">
            Selecione o tipo de usuário para visualizar o dashboard:
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {userTypes.map((userType) => (
              <Card 
                key={userType.type}
                className={`cursor-pointer transition-all ${
                  selectedUser === userType.type 
                    ? 'ring-2 ring-blue-500 bg-blue-50' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => setSelectedUser(userType.type)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${userType.color} text-white`}>
                      <userType.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{userType.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {userType.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Dashboard */}
      <div>
        {renderDashboard()}
      </div>
    </div>
  );
}