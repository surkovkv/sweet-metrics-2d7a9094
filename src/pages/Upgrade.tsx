import { motion } from "framer-motion";
import { Check, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ManaLensNavbar from "@/components/ManaLensNavbar";

const plans = [
  {
    name: "Free",
    price: "0₽",
    features: [
      "Базовый анализ колоды",
      "Турнирный режим (3 колоды)",
      "Ограниченная матрица",
    ],
    current: true,
  },
  {
    name: "Pro",
    price: "299₽/мес",
    features: [
      "Полный анализ колоды",
      "Турнирный режим (3 и 4 колоды)",
      "Детальная матрица винрейтов",
      "История сессий",
      "Экспорт в PDF",
      "Приоритетные обновления",
    ],
    current: false,
  },
];

const Upgrade = () => {
  return (
    <div className="min-h-screen bg-background">
      <ManaLensNavbar />
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold text-foreground mb-3 text-center">
            Тарифный <span className="text-primary">план</span>
          </h1>
          <p className="text-muted-foreground text-center mb-10">
            Выбери план, который подходит для твоих турниров
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`bg-card border-border ${!plan.current ? "border-primary/50 ring-1 ring-primary/20" : ""}`}
              >
                <CardHeader>
                  <div className="flex items-center gap-2">
                    {!plan.current && <Crown className="h-5 w-5 text-primary" />}
                    <CardTitle className="font-display text-xl">{plan.name}</CardTitle>
                  </div>
                  <p className="text-3xl font-bold text-foreground">{plan.price}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-primary shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {plan.current ? (
                    <Button variant="outline" className="w-full" disabled>
                      Текущий план
                    </Button>
                  ) : (
                    <Button
                      className="w-full gap-2"
                      onClick={() => window.open("https://t.me/tourneyhelper_bot", "_blank")}
                    >
                      <Crown className="h-4 w-4" />
                      Оформить Pro
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Upgrade;
