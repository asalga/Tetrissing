/*
 * General utilities
 */
public static class Utils{
  
  /*
   * We use Math.random() instead of Processing's random() to prevent
   * having to make this class a singleton and take a Papplet. That code
   * would be unnecessarily complex.
   */
  public static int getRandomInt(int minVal, int maxVal) {
    float scaleFloat = (float) Math.random();
    return minVal + (int) (scaleFloat * (maxVal - minVal + 1));
  }
  
  /*
   * This is here simply to provide a means for us to call a custom method for the JS version.
   */
  public static int charCodeAt(char ch){
    return ch;
  }
}
