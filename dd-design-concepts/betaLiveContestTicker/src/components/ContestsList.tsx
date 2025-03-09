import React from "react";
import { ContestItem, ContestItemProps } from "./ContestItem";
interface ContestsListProps {
  contests: ContestItemProps[];
}
export const ContestsList: React.FC<ContestsListProps> = ({
  contests
}) => {
  return <div className="flex flex-col w-full bg-[rgba(33,29,47,0.3)] text-black font-[Inter,system-ui,sans-serif] text-sm">
      {contests.map((contest, index) => <ContestItem key={contest.id} {...contest} />)}
    </div>;
};