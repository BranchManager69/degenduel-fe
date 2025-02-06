// src/components/landing/contests/ContestList.tsx
import React from "react";
import { Contest } from "../../../types/index";
import { ContestCard } from "../../contests/browser/ContestCard";

interface ContestListProps {
  contests: Contest[];
  title: string;
}

export const ContestList: React.FC<ContestListProps> = ({
  contests,
  title,
}) => {
  return (
    <section className="py-8">
      <h2 className="text-2xl font-bold text-gray-100 mb-6">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {contests.map((contest) => (
          <ContestCard key={contest.id} contest={contest} />
        ))}
      </div>
    </section>
  );
};
