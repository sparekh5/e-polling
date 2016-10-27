
//package src.main.java;

import java.util.ArrayList;
import java.util.List;

class Argument {
    private boolean isSupporter;
    private List<Argument> children;
    private String argumentTitle;
    //TODO: Should probably change to be a number on a scale of 1 to 10, with
    //      10 being strongly agree, and 1 being strongly disagree
    /* True for agreement/yes, false for disagreement/no. */
    private boolean vote;
    /* Use score function (sigma) from DF-QuAD algorithm to calculate strength
     * of argument using the vote base score as the base score. */
    private double strength;

    Argument(boolean vote, String argumentTitle, boolean isSupporter) {
        this.argumentTitle = argumentTitle;
        this.vote = vote;
        this.isSupporter = isSupporter;
        this.children = new ArrayList<>();

    }

    boolean getVote() {
        return vote;
    }
    boolean isSupporter() { return isSupporter;}

    public String getArgumentTitle() {
        return argumentTitle;
    }


    public void addChild(boolean vote, String argumentTitle,
            boolean isSupporter) {
        Argument child = new Argument(vote, argumentTitle, isSupporter);
        this.children.add(child);
    }

    //TODO: Implement algorithm to check that the tree is fully consistent
    //      (IS THIS WHAT isStable() was meant to be doing)
    /* Checks that this argument is consistent with its supporters and
     * attackers.
     * If there are no supporters or attackers, it is consistent.
     * If we agree with the statement, but agree with any of its attackers and
     * don't agree with any of its supporters, then it is inconsistent.
     * If we disagree with the statement, but agree with any of its supporters
     * and don't agree with any of its attackers, then it is inconsistent.
     * Otherwise, it is consistent. */
    protected boolean isConsistent() {
        return vote?
            !hasAttackerVote() || hasSupporterVote():
            hasAttackerVote() || !hasSupporterVote();
    }

    /*
    Concatenates Attacker and Supporters and returns list of Arguments,
    this is used in class MasterTree for the argumentToList() function
    */
    List<Argument> getChildren(){
        return children;
    }

    /* Returns true if the subtree with this argument as the root is
     * consistent, which is when the root and all of its children are
     * consistent. */
    public boolean isSubTreeConsistent() {
        for (Argument child : children) {
            if (!child.isSubTreeConsistent()) {
                return false;
            }
        }

        return this.isConsistent();
    }

    /* Returns true if the voter has agreed with a supporter of this
     * argument. Returns false otherwise. */
    private boolean hasSupporterVote() {
        for (Argument child : this.children) {
            if (child.getVote() && child.isSupporter()) {
                return true;
            }
        }

        return false;
    }

    /* Returns true if the voter has agreed with an attacker of this
     * argument. Returns false otherwise. */
    private boolean hasAttackerVote() {
        for (Argument child : this.children) {
            if (child.getVote() && !child.isSupporter()) {
                return true;
            }
        }

        return false;
    }

}
